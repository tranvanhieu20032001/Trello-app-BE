import { Body, Controller, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { ColumnDTO } from './dto';
import { JwtAuthGuard } from '../guard';

@Controller('/api/v1/columns')
export class ColumnsController {
    constructor(private columnsService: ColumnsService) { }

    // @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() columnDTO: ColumnDTO, @Request() req) {
        return this.columnsService.createColumn(columnDTO)
    }

    @Put(":columnId/card/order")
    async updateColumnIds(@Param("columnId") columnId: string, @Body() body: { cardOrderIds: string[] }) {
        return this.columnsService.updateOrderCardIds(columnId, body.cardOrderIds)
    }
}
