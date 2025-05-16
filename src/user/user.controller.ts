import { Controller, Get, Param, Patch, Post, Req, Request, UseGuards } from '@nestjs/common';
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

    @UseGuards(AuthGuard('jwt'))
    @Get('notifications')
    async getNotifications(@Request() req) {
        return this.userService.getNotifications(req.user.user.id)
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('notifications/mark-as-read')
    async markAsRead(@Request() req) {
        return this.userService.markAsRead(req.user.user.id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('notifications/:id/read')
    async markSingleAsRead(@Param('id') id: string) {
        return this.userService.markNotificationAsRead(id);
    }


}
