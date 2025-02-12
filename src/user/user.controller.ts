import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('api/v1/users')
export class UserController {
    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    me(@Req() request: Request) {
        return request.user
    }

}
