import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { validateUser } from '../utils/validations';
import { ColumnDTO } from '../columns/dto';
import { cardDTO } from './dto/card.dto';
import { throwError } from 'rxjs';

@Injectable()
export class CardsService {
    constructor(private prisma: PrismaService) { }

    async createCard(cardDTO: cardDTO) {
        try {
            // await validateUser(this.prisma, userId)

            const newCard = await this.prisma.card.create({
                data: {
                    title: cardDTO.title,
                    columnId: cardDTO.columnId,
                    boardId: cardDTO.boardId
                }
            })

            const board = await this.prisma.board.findUnique({
                where: { id: cardDTO.boardId },
                select: { columnOrderIds: true }
            })
            if (!board) {
                throw new Error("Board not found");
            }

            const column = await this.prisma.column.findUnique({
                where: { id: cardDTO.columnId },
                select: { cardOrderIds: true }
            })
            if (!column) {
                throw new Error("Column not found");
            }

            const updateCardOrder = column.cardOrderIds.includes(newCard.id) ? column.cardOrderIds : [...column.cardOrderIds, newCard.id]
            await this.prisma.column.update({
                where: { id: cardDTO.columnId },
                data: { cardOrderIds: updateCardOrder }
            })

            return{
                success:true,
                message:"Card created successfully",
                data:newCard
            }
        } catch (error) {
            console.error("error creating cards", error);
            throw new InternalServerErrorException(error.message)
        }
    }
}
