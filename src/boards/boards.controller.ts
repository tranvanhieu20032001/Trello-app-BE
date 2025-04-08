import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Req, Request, UseGuards } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { BoardDTO } from './dto/board.dto';
import { JwtAuthGuard } from '../guard';

@Controller('api/v1/boards')
export class BoardsController {
    constructor(private boardsService: BoardsService) { }
    @Get('/')
    getAllBoards() {
        return {
            message: 'Get all boards successfully!',
            data: []
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() boardDTO: BoardDTO, @Request() req) {
        const userId = req.user.user.id
        return this.boardsService.createBoard(boardDTO, userId);
    }


    @UseGuards(JwtAuthGuard)
    @Get('/:id')
    async getBoardById(@Param('id') id: string, @Request() req) {
        const userId = req.user.user.id
        return this.boardsService.getBoardById(id, userId)
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
        return this.boardsService.reOpenBoard(id)
    }

    @Post('join')
    async joinWorkspace(@Body() body: { boardId, userId }) {
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
        return await this.boardsService.removeMemberBoar(boardId, body.ownerId, body.userId)
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
      ){
        return this.boardsService.updateColumnOrder(boardId, body.columnOrderIds)
      }

}
