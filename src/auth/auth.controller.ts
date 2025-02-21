import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDTO } from "./dto";
import { Response } from "express";
import { GoogleAuthGaurd } from "../guard/google-auth.guard";
import { Public } from "@prisma/client/runtime/library";
@Controller('api/v1/auth')

export class AuthController {
   constructor(private authService: AuthService) {
   }

   @Post("register") //Register a new user
   //register(@Req() request: Request)
   register(@Body() body: AuthDTO) {
      //not validate using class-validator and class transformer
      return this.authService.register(body)
   }

   @Post("login")
   login(@Body() body: AuthDTO, @Res() res: Response) {
      return this.authService.login(body,res)
   }

   @Get("verify")
   verifyEmail(@Query('token') token: string){
      return this.authService.verifyEmail(token)
   }

   @Post('refresh')
   refreshTokens(@Body() body: { userId: string, refreshToken: string }) {
       return this.authService.refreshTokens(body.userId, body.refreshToken);
   }

   @Post('logout')
   logout(@Body() body: { userId: string }) {
       return this.authService.logout(body.userId);
   }


   @UseGuards(GoogleAuthGaurd)
   @Get("google/login")
   googleLogin(){}

   @UseGuards(GoogleAuthGaurd)
   @Get("google/redirect")
   googleRedirect(@Req() req){
      return this.authService.loginGoogle(req.user);
   }


}
