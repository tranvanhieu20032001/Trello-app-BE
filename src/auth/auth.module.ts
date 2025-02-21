import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "../strategy";
import { EmailModule } from "../email/email.module";
import { EmailController } from "../email/email.controller";
import { EmailService } from "../email/email.service";
import { GoogleStrategy } from "../strategy/google.strategy";
@Module({
    controllers: [
        AuthController, EmailController
    ],
    imports: [JwtModule, EmailModule],
    providers: [AuthService, JwtStrategy, EmailService, GoogleStrategy]
})

export class AuthModule { }