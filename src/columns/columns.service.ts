import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ColumnDTO, MoveCardBetweenColumnsDTO } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { validateUser } from '../utils/validations';
import { AppGateway } from '../gateways/app.gateway';

@Injectable()
export class ColumnsService {
  constructor(private prisma: PrismaService, private readonly appGateWay: AppGateway) { }

  async createColumn(columnDTO: ColumnDTO) {
    try {

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
      this.appGateWay.notifyBoard(columnDTO.boardId)
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
  async copyColumn(columnId: string) {
    const originalColumn = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: {
        cards: {
          include: {
            CardMembers: true,
            labels: true,
            attachments: true,
            comments: true,
            checklists: {
              include: {
                items: true
              }
            },
          },
        },
      },
    });

    if (!originalColumn) {
      throw new NotFoundException('Column not found');
    }

    // 1. Tạo column mới
    const newColumn = await this.prisma.column.create({
      data: {
        title: `${originalColumn.title} (Copy)`,
        boardId: originalColumn.boardId,
      },
    });

    // 2. Copy từng card
    for (const card of originalColumn.cards) {
      const newCard = await this.prisma.card.create({
        data: {
          title: card.title,
          description: card.description,
          cover: card.cover,
          startDate: card.startDate,
          dueDate: card.dueDate,
          isComplete: card.isComplete,
          columnId: newColumn.id,
          boardId: originalColumn.boardId,
        },
      });

      // 3. Copy CardMembers
      if (card.CardMembers.length > 0) {
        await this.prisma.cardMember.createMany({
          data: card.CardMembers.map((cm) => ({
            cardId: newCard.id,
            userId: cm.userId,
          })),
        });
      }

      if (card.comments.length > 0) {
        await this.prisma.comment.createMany({
          data: card.comments.map((cmt) => ({
            content: cmt.content,
            cardId: newCard.id,
            userId: cmt.userId, // 👈 giữ nguyên user gốc
          })),
        });
      }



      // 5. Copy Labels
      if (card.labels.length > 0) {
        await this.prisma.cardLabel.createMany({
          data: card.labels.map((cl) => ({
            cardId: newCard.id,
            labelId: cl.labelId,
          })),
        });
      }

      // 6. Copy attachments
      if (card.attachments.length > 0) {
        await this.prisma.attachment.createMany({
          data: card.attachments.map((att) => ({
            type: att.type,
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            userId: att.userId,
            cardId: newCard.id,
          })),
        });
      }

      // 7. Copy checklist
      for (const checklist of card.checklists) {
        const newChecklist = await this.prisma.checklist.create({
          data: {
            title: checklist.title,
            cardId: newCard.id,
          },
        });

        if (checklist.items.length > 0) {
          await this.prisma.checklistItem.createMany({
            data: checklist.items.map((item) => ({
              text: item.text,
              isChecked: item.isChecked,
              checklistId: newChecklist.id,
            })),
          });
        }
      }

      const board = await this.prisma.board.findUnique({
        where: { id: originalColumn.boardId },
        select: { columnOrderIds: true },
      });

      const updatedColumnOrderIds = [
        ...(board?.columnOrderIds || []),
        newColumn.id,
      ];

      await this.prisma.board.update({
        where: { id: originalColumn.boardId },
        data: { columnOrderIds: updatedColumnOrderIds },
      });

      this.appGateWay?.notifyBoard(originalColumn.boardId);

      return {
        success: true,
        message: 'Column copied successfully',
        data: newColumn,
      };
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
    // this.columnGateway.updateOrderCardIds(columnn?.boardId)
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
    // this.columnGateway.updateOrderCardIds(columnn?.boardId)
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