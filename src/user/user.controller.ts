import { Controller, Get, Req, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';

@Controller('api/v1/users')
export class UserController {
    constructor(private userService: UserService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    async me(@Request() req) {
        return this.userService.getMe(req.user.user.id)
    }

}
