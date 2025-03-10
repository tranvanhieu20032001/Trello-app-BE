import { Controller, Get, Param, Post } from '@nestjs/common';
import { InviteService } from './invite.service';

@Controller('api/v1/invite')
export class InviteController {
    constructor(private inviteService: InviteService) { }

    @Post(":workspaceId")
    async createInvite(@Param('workspaceId') workspaceId: string) {
        return this.inviteService.createInvite(workspaceId)
    }

    @Get(':token')
    async verifyInvite(@Param('token') token:string){
        return this.inviteService.verifyInvite(token)
    }
}
