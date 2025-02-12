import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as argon from 'argon2'
import { AuthDTO } from "./dto";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "../email/email.service";

@Injectable()
export class AuthService {
    constructor(private prismaService: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private emailService: EmailService
    ) { }

    async register(authDTO: AuthDTO) {
        const hashedPassword = await argon.hash(authDTO.password)
        try {
            const user = await this.prismaService.user.create({
                data: {
                    email: authDTO.email,
                    password: hashedPassword,
                    username: '',
                },
                select: {
                    id: true,
                    email: true,
                    username:true

                }
            })
            const token = await this.signJwtToken(user.id, user.email, user.username);
            await this.emailService.sendVerificationEmail(user.email, token.accessToken);
            return {
                message: 'Registration successful! Please check your email to verify your account!',
                token: token
            }
        } catch (error) {
            // Handle duplicate email error
            if (error.code === 'P2002') {
                throw new ForbiddenException('Email is already registered');
            }
            // Handle other errors
            throw new Error('An error occurred during registration');
        }
    }

    async login(authDTO: AuthDTO) {
        const user = await this.prismaService.user.findUnique({
            where: { email: authDTO.email }
        });

        if (!user) {
            throw new ForbiddenException('User not found');
        }
        if(!user.isVerified){
            return{
                success:false,
                message:"The account has not been verified yet"
            }
        }
        if(!user.isActive){
            return{
                success:false,
                message:"The account is blocked"
            } 
        }
        const passwordMatched = await argon.verify(
            user.password,
            authDTO.password
        )
        if (!passwordMatched) {
            throw new ForbiddenException('Incorrect password')
        }
        delete user.password //remove 1 field in the object

       const token = await this.signJwtToken(user.id, user.email, user.username);
       return{
        success:true,
        message: "Login successful",
        token,
        user
       }
    }

    async verifyEmail(token: string) {
        try {
            // Giải mã token
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'), // Sử dụng secret từ config
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
                success:true,
                message: 'Email verified successfully',
            };
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Verification token has expired. Please request a new verification email.');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid verification token. Please try again.');
            } else {
                throw new Error(`Email verification failed: ${error.message}`);
            }
        }
    }


    async signJwtToken(userId: string, email: string, username: string): Promise<{ accessToken: string }> {
        const payload = {
            sub: userId,
            email: email,
            username: username,
        }
        const jwtString = await this.jwtService.signAsync(payload, {
            expiresIn: '15d',
            secret: this.configService.get('JWT_SECRET')
        })
        return {
            accessToken: jwtString
        }
    }
}
