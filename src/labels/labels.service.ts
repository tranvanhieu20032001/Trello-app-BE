import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LabelDTO } from './dto';

@Injectable()
export class LabelsService {
    constructor(private prisma: PrismaService) { }

    async createLabel(labelDTO: LabelDTO) {
        const { boardId, name, color } = labelDTO;

        const board = await this.prisma.board.findUnique({
            where: { id: boardId },
        });

        if (!board) {
            throw new NotFoundException("Board not found");
        }

        // this.boardGateway.notifyBoard(boardId)

        return this.prisma.label.create({
            data: {
                name,
                color,
                boardId,
            },
        });
    }

    async removeLabel(labelId: string) {
        try {
            const label = await this.prisma.label.findUnique({
                where: { id: labelId },
            });

            if (!label) {
                throw new NotFoundException("Label not found");
            }

            return await this.prisma.label.delete({
                where: { id: labelId },
            });
        } catch (error) {
            throw new InternalServerErrorException("Failed to remove label");
        }
    }

    async updateLabel(labelId: string, body: { name: string; color: string }) {
        const label = await this.prisma.label.findUnique({
            where: { id: labelId },
        });

        if (!label) {
            throw new NotFoundException("Label not found");
        }

        return this.prisma.label.update({
            where: { id: labelId },
            data: {
                name: body.name,
                color: body.color,
            },
        });
    }
    
    async toggleLabel(cardId:string, labelId:string){
        const existing = await this.prisma.cardLabel.findUnique({
            where: {
              cardId_labelId: { cardId, labelId },
            },
          });
        
          if (existing) {
            await this.prisma.cardLabel.delete({
              where: {
                cardId_labelId: { cardId, labelId },
              },
            });
            return { action: "removed" };
          } else {
            await this.prisma.cardLabel.create({
              data: { cardId, labelId },
            });
            return { action: "added" };
          }
    }

}
