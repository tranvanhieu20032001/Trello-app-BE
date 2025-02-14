import { Body, Controller, Get, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { BoardDTO } from './dto/board.dto';
import { JwtAuthGuard } from '../guard';

@Controller('api/v1/boards')
export class BoardsController {
    constructor(private boardsService: BoardsService) {}
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


    // @UseGuards(JwtAuthGuard)
    @Get('/:id')
    async getBoardById(@Param('id') id:string){
        return this.boardsService.getBoardById(id)
    }

}
