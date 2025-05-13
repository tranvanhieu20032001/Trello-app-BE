import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, Request, UseGuards } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { BoardDTO } from './dto/board.dto';
import { JwtAuthGuard } from '../guard';

@Controller('api/v1/boards')
export class BoardsController {
    constructor(private boardsService: BoardsService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getBoardByUser() { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() boardDTO: BoardDTO, @Request() req) {
        const userId = req.user.user.id
        return this.boardsService.createBoard(boardDTO, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('/:id')
    async getBoardById(@Param('id') id: string, @Request() req) {
        console.log("dsahgsd");

        const userId = req.user.user.id
        return this.boardsService.getBoardById(id, userId)
    }

    @UseGuards(JwtAuthGuard)
    @Get("/user/recent")
    async getBoardRecent(@Request() req) {
        const userId = req.user.user.id
        return this.boardsService.getBoardRecent(userId)
    }

    @UseGuards(JwtAuthGuard)
    @Get("/user/starred")
    async getBoardStarred(@Request() req) {
        const userId = req.user.user.id
        return this.boardsService.getBoardStarred(userId)
    }

    @UseGuards(JwtAuthGuard)
    @Patch('/:id/close')
    async closeBoard(@Param('id') id: string, @Request() req) {
        const userId = req.user.user.id
        return this.boardsService.closeBoard(id, userId)
    }

    @UseGuards(JwtAuthGuard)
    @Patch('/:id/reopen')
    async reOpenBoard(@Param('id') id: string, @Request() req) {
        const userId = req.user.user.id
        return this.boardsService.reOpenBoard(id, userId)
    }
    @UseGuards(JwtAuthGuard)
    @Delete('/:id')
    async deleteBoard(@Param('id') id: string, @Request() req) {
        const userId = req.user.user.id
        return this.boardsService.deleteBoard(id, userId)
    }

    @Post('join')
    async joinBoard(@Body() body: { boardId, userId }, @Request() req) {
        return this.boardsService.addMember(body.boardId, body.userId)
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':boardId/leave')
    async leaveBoard(@Param('boardId') boardId: string, @Req() req) {
        const userId = req.user.user.id;
        return this.boardsService.leaveBoard(boardId, userId)
    }

    @Delete(":boardId/remove")
    async removeUser(@Param("boardId") boardId: string, @Body() body: { ownerId: string, userId: string }) {
        return await this.boardsService.removeMemberBoard(boardId, body.ownerId, body.userId)
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':boardId/visibility')
    async changeVisibility(
        @Param('boardId') boardId: string,
        @Body('visibility') visibility: string,
        @Req() req
    ) {
        const userId = req.user.user.id;
        return this.boardsService.changeVisibility(boardId, userId, visibility);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':boardId/starred')
    async toggleStarred(
        @Param('boardId') boardId: string,
        @Req() req
    ) {
        const userId = req.user.user.id;
        return this.boardsService.toggleStarred(boardId, userId);
    }

    @Put(":boardId/column/order")
    async updateColumnOrder(
        @Param('boardId') boardId: string,
        @Body() body: { columnOrderIds: string[] }
    ) {
        return this.boardsService.updateColumnOrder(boardId, body.columnOrderIds)
    }

    @UseGuards(JwtAuthGuard)
    @Put(":boardId/rename")
    async changeTitleBoard(@Param('boardId') boardId: string, @Body() body: { newname: string }, @Req() req) {
        const userId = req.user.user.id;
        return this.boardsService.changeTitleBoard(boardId, userId, body.newname)
    }

}
