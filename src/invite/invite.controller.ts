import { Controller, Get, Param, Post } from '@nestjs/common';
import { InviteService } from './invite.service';

@Controller('api/v1/invite')
export class InviteController {
    constructor(private inviteService: InviteService) { }

    @Post("wp/:workspaceId")
    async createInviteToWorkspace(@Param('workspaceId') workspaceId: string) {
        return this.inviteService.createInvite({ workspaceId: workspaceId });
    }

    @Post("b/:boardId")
    async createInviteToBoard(@Param('boardId') boardId: string) {
        return this.inviteService.createInvite({ boardId: boardId });
    }

    @Get(':token')
    async verifyInvite(@Param('token') token: string) {
        return this.inviteService.verifyInvite(token)
    }
}
