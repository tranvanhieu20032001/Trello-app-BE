import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ColumnDTO, MoveCardBetweenColumnsDTO } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { validateUser } from '../utils/validations';

@Injectable()
export class ColumnsService {
    constructor(private prisma: PrismaService) { }

    async createColumn(columnDTO: ColumnDTO) {
        try {
            // await validateUser(this.prisma, userId);

            const newColumn = await this.prisma.column.create({
                data: {
                    title: columnDTO.title,
                    boardId: columnDTO.boardId
                }
            });

            const board = await this.prisma.board.findUnique({
                where: { id: columnDTO.boardId },
                select: { columnOrderIds: true }
            });

            if (!board) {
                throw new Error("Board not found");
            }

            const updatedColumnOrder = board.columnOrderIds.includes(newColumn.id)
                ? board.columnOrderIds
                : [...board.columnOrderIds, newColumn.id];

            await this.prisma.board.update({
                where: { id: columnDTO.boardId },
                data: { columnOrderIds: updatedColumnOrder }
            });

            return {
                success: true,
                message: "Column created successfully",
                data: newColumn
            };

        } catch (error) {
            console.error("Error creating column:", error);
            throw new InternalServerErrorException(error.message)
        }
    }

    async updateOrderCardIds(colummId: string, cardOrderIds: string[]) {
        const columnn = await this.prisma.column.findUnique({
            where: { id: colummId }
        })
        if (!columnn) throw new NotFoundException("Column not found")
        await this.prisma.column.update({
            where: { id: colummId },
            data: { cardOrderIds: cardOrderIds }
        })
    }

    async updateCardOrderDifferentColumn(data: MoveCardBetweenColumnsDTO) {
        const { activeCardId, oldColumnId, newColumnId, cardOrderIdsOldColumn, cardOrderIdsNewColumn } = data;

        await this.prisma.column.update({
            where: { id: oldColumnId },
            data: { cardOrderIds: cardOrderIdsOldColumn }
        })

        await this.prisma.column.update({
            where: { id: newColumnId },
            data: { cardOrderIds: cardOrderIdsNewColumn },
        });

        await this.prisma.card.update({
            where: { id: activeCardId },
            data: { columnId: newColumnId },
          });

       
    }
}