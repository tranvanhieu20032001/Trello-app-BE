import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
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
    async get(@Req() req){
        return this.workspaceService.getWorkSpaceByUser(req.user.user.id)
    }
}
