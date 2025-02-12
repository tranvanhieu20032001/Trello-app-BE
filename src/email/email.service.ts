import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor(public configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: configService.get("EMAIL_APP"),
                pass: configService.get("EMAIL_PASSWORD"),
            },
        });
    }

    async sendVerificationEmail(email: string, token: string) {
        const verificationUrl = `http://localhost:${this.configService.get("PORT")}/api/v1/auth/verify?token=${token}`;
        const mailOptions = {
            from: `"Your App" <${this.configService.get("EMAIL_APP")}>`, // Tên người gửi
            to: email, // Email người nhận
            subject: 'Verify your account',
            html: `
        <p>Thank you for registering! Please verify your account by clicking the link below:</p>
        <a href="${verificationUrl}">Verify your account</a>
      `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent:', info.response);
        } catch (error) {
            throw new Error('Failed to send verification email');
        }
    }
}
