import { Body, Controller, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { ColumnDTO, MoveCardBetweenColumnsDTO } from './dto';
import { JwtAuthGuard } from '../guard';

@Controller('/api/v1/columns')
export class ColumnsController {
    constructor(private columnsService: ColumnsService) { }

    // @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() columnDTO: ColumnDTO) {
        return this.columnsService.createColumn(columnDTO)
    }

    @Post(':id/copy')
    async copyColumn(@Param('id') id: string) {
        return this.columnsService.copyColumn(id);
    }


    @Put(":columnId/card/order")
    async updateColumnIds(@Param("columnId") columnId: string, @Body() body: { cardOrderIds: string[] }) {
        return this.columnsService.updateOrderCardIds(columnId, body.cardOrderIds)
    }

    @Put("/card/order")
    async updateCardOrderDifferentColumn(@Body() data: MoveCardBetweenColumnsDTO) {
        return this.columnsService.updateCardOrderDifferentColumn(data)
    }

    @UseGuards(JwtAuthGuard)
    @Put(":boardId/rename")
    async renameList(@Param("boardId") boardId: string, @Body() body: { newname: string }, @Request() req) {
        const userId = req.user.user.id
        return this.columnsService.renameList(boardId, userId, body.newname)
    }
}
