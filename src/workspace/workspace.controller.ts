import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { JwtAuthGuard } from '../guard';
import { query } from 'express';

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

    @Get('search-user')
    async searchUser(@Query('query') query: string) {
        return this.workspaceService.searchUser(query);
    }

    @Post('updateWorkspaceName')
    async updateWorkspaceName(@Body() body: { workspaceId: string; userId: string; newName: string }) {
        return await this.workspaceService.updateWorkspaceName(body.workspaceId, body.userId, body.newName)
    }
}
