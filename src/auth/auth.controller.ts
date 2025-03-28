import { Body, Controller, ForbiddenException, Get, HttpCode, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDTO } from "./dto";
import { Request, Response } from "express";
import { GoogleAuthGuard } from "../guard/google-auth.guard";
import { log } from "console";

@Controller('api/v1/auth')

export class AuthController {
   constructor(private authService: AuthService) {
   }

   @Post("register")
   register(@Body() body: AuthDTO) {
      return this.authService.register(body)
   }

   @Post("login")
   login(@Body() body: AuthDTO, @Res() res: Response) {
      return this.authService.login(body, res)
   }

   @Get("verify")
   verifyEmail(@Query('token') token: string) {
      return this.authService.verifyEmail(token)
   }

   @Post("refresh")
   async refreshTokens(@Req() req: Request, @Res() res: Response) {
      const refreshToken = req.cookies?.refreshToken;
      return this.authService.refreshTokens(refreshToken, res);
   }


   @Post('logout')
   @HttpCode(200)
   logout(@Body() body: { userId: string }, @Res() res: Response) {
      return this.authService.logout(body.userId, res);
   }


   @UseGuards(GoogleAuthGuard)
   @Get("google/login")
   googleLogin() { }

   @UseGuards(GoogleAuthGuard)
   @Get("google/redirect")
   googleRedirect(@Req() req, @Res() res: Response) {
      return this.authService.loginGoogle(req.user, res);
   }
}
