import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDTO } from "./dto";
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
   login(@Body() body: AuthDTO) {
      return this.authService.login(body)
   }

   @Get("verify")
   verifyEmail(@Query('token') token: string){
      return this.authService.verifyEmail(token)
   }
}
