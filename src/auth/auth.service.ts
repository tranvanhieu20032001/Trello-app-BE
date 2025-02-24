import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as argon2 from 'argon2';
import { AuthDTO } from "./dto";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "../email/email.service";
import { Response } from 'express';

@Injectable()
export class AuthService {
    constructor(
        private prismaService: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private emailService: EmailService
    ) { }

    /** Đăng ký tài khoản */
    async register(authDTO: AuthDTO) {
        const hashedPassword = await argon2.hash(authDTO.password);
        try {
            const user = await this.prismaService.user.create({
                data: {
                    email: authDTO.email,
                    password: hashedPassword,
                    username: authDTO.username,
                },
                select: {
                    id: true,
                    email: true,
                    username: true
                }
            });

            // Tạo token xác thực email
            const { accessToken } = await this.signJwtToken(user.id, user.email, user.username);
            await this.emailService.sendVerificationEmail(user.email, accessToken);

            return {
                message: 'Registration successful! Please check your email to verify your account!',
                token: accessToken
            };
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ForbiddenException('Email is already registered');
            }
            throw new Error('An error occurred during registration');
        }
    }

    /** Đăng nhập */
    async login(authDTO: AuthDTO, res: Response) {
        const user = await this.prismaService.user.findUnique({
            where: { email: authDTO.email }
        });

        if (!user) {
            throw new ForbiddenException('User not found');
        }
        if (!user.isVerified) {
            throw new ForbiddenException("The account has not been verified yet");
        }
        if (!user.isActive) {
            throw new ForbiddenException("The account is blocked");
        }

        const passwordMatched = await argon2.verify(user.password, authDTO.password);
        if (!passwordMatched) {
            throw new ForbiddenException('Incorrect password');
        }
        delete user.password;

        const { accessToken, refreshToken } = await this.signJwtToken(user.id, user.email, user.username);
        await this.updateRefreshToken(user.id, refreshToken);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false, // Bật lên nếu dùng HTTPS
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
        });
        return res.status(200).json({
            success: true,
            message: "Login successful",
            accessToken,
            user
        });
    }


    async loginGoogle(googleUser: any, res: Response) {
        let user = await this.prismaService.user.findUnique({
            where: { email: googleUser.email }
        });

        if (!user) {
            user = await this.prismaService.user.create({
                data: {
                    email: googleUser.email,
                    username: googleUser.username,
                    password: '',
                    isVerified: true,
                    avatar: googleUser.avatar
                }
            });
        }

        const { accessToken, refreshToken } = await this.signJwtToken(user.id, user.email, user.username);

        await this.updateRefreshToken(user.id, refreshToken);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false, // Dùng `true` nếu HTTPS
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        return res.redirect(`http://localhost:5173/callback?token=${accessToken}`)
    }


    async verifyEmail(token: string) {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });

            const email = payload.email;
            const user = await this.prismaService.user.update({
                where: { email },
                data: { isVerified: true },
            });

            if (!user) {
                throw new Error('User not found or already verified');
            }

            return {
                success: true,
                message: 'Email verified successfully',
            };
        } catch (error) {
            throw new Error(`Email verification failed: ${error.message}`);
        }
    }


    async logout(userId: string, res: Response) {
        await this.prismaService.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            sameSite: 'strict',
            path: '/'
        });
        res.status(200).json({ success: true, message: "Logout successful" });
    }
  
    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.refreshToken) {
            throw new ForbiddenException('Access Denied');
        }

        const isMatch = await argon2.verify(user.refreshToken, refreshToken);
        if (!isMatch) {
            throw new ForbiddenException('Invalid Refresh Token');
        }

        const { accessToken, refreshToken: newRefreshToken } = await this.signJwtToken(user.id, user.email, user.username);
        await this.updateRefreshToken(user.id, newRefreshToken);

        return { accessToken, refreshToken: newRefreshToken };
    }

    async signJwtToken(userId: string, email: string, username: string): Promise<{ accessToken: string, refreshToken: string }> {
        const payload = { sub: userId, email, username };

        const accessToken = await this.jwtService.signAsync(payload, {
            expiresIn: '2m',
            secret: this.configService.get('JWT_SECRET'),
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: '7d',
            secret: this.configService.get('JWT_REFRESH_SECRET'),
        });

        return { accessToken, refreshToken };
    }


    async updateRefreshToken(userId: string, refreshToken: string) {
        const hashedToken = await argon2.hash(refreshToken);
        await this.prismaService.user.update({
            where: { id: userId },
            data: { refreshToken: hashedToken },
        });
    }
}
