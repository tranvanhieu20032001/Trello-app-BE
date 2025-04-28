import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ColumnDTO, MoveCardBetweenColumnsDTO } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { validateUser } from '../utils/validations';
import { ColumnGateway } from '../gateways/column.gateway';

@Injectable()
export class ColumnsService {
  constructor(private prisma: PrismaService, private columnGateway: ColumnGateway) { }

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

      this.columnGateway.notifyColumn(columnDTO.boardId)

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
    this.columnGateway.updateOrderCardIds(columnn?.boardId)
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
    const columnn = await this.prisma.column.findUnique({
      where: { id: oldColumnId }
    })
    this.columnGateway.updateOrderCardIds(columnn?.boardId)
  }

  async renameList(columnId: string, userId: string, newName: string) {
    await validateUser(this.prisma, userId);

    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: true
      }
    });

    if (!column) throw new NotFoundException("List not found");

    if (column.board.ownerId !== userId) {
      throw new ForbiddenException("You are not the owner of this board");
    }

    const existingColumn = await this.prisma.column.findFirst({
      where: {
        boardId: column.boardId,
        title: newName,
        NOT: {
          id: columnId
        }
      }
    });

    if (existingColumn) {
      throw new BadRequestException("A list with this name already exists in the board");
    }

    return await this.prisma.column.update({
      where: { id: columnId },
      data: {
        title: newName
      }
    });
  }

}