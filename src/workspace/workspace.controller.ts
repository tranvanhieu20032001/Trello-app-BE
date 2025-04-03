import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { JwtAuthGuard } from '../guard';

@Controller('api/v1/workspace')
export class WorkspaceController {
    constructor(private workspaceService: WorkspaceService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Req() req, @Body() body) {
        return this.workspaceService.createWorkspace(req.user.user.id, body)
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async get(@Req() req) {
        return this.workspaceService.getWorkSpaceByUser(req.user.user.id)
    }

    @Get(':id')
    async getWorkspaceById(@Param('id') id: string) {
        return this.workspaceService.getWorkspaceById(id);
    }


    @Post('join')
    async joinWorkspace(@Body() body: { workspaceId, userId }) {
        return this.workspaceService.addMember(body.workspaceId, body.userId)
    }

    @Get('search/user')
    async searchUser(@Query('query') query: string) {
        return this.workspaceService.searchUser(query);
    }

    @Post('updateWorkspaceName')
    async updateWorkspaceName(@Body() body: { workspaceId: string; userId: string; newName: string }) {
        return await this.workspaceService.updateWorkspaceName(body.workspaceId, body.userId, body.newName)
    }
    
    @UseGuards(JwtAuthGuard)
    @Patch(':workspaceId/leave')
    async leaveWorkspace(@Param('workspaceId') workspaceId: string, @Req() req) {
        const userId = req.user.user.id;
        return this.workspaceService.leaveWorkspace(workspaceId, userId)
    }

    @Delete(":workspaceId/remove")
    async removeUser(@Param("workspaceId") workspaceId: string, @Body() body: { ownerId: string, userId: string }) {
        return await this.workspaceService.removeMemberWorkspace(workspaceId, body.ownerId, body.userId)
    }
}
