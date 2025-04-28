import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { cardDTO } from './dto/card.dto';
import { CardGateway } from '../gateways/card.gateway';
import { ColumnGateway } from '../gateways/column.gateway';

@Injectable()
export class CardsService {
    constructor(private prisma: PrismaService, private cardGateway: CardGateway, private columnGateway: ColumnGateway) { }

    async createCard(cardDTO: cardDTO) {
        try {

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
            this.columnGateway.notifyColumn(cardDTO.columnId)

            return {
                success: true,
                message: "Card created successfully",
                data: newCard
            }
        } catch (error) {
            console.error("error creating cards", error);
            throw new InternalServerErrorException(error.message)
        }
    }

    async moveCard(cardId: string, columnId: string) {
        this.cardGateway.notifyCard(cardId)
        return this.prisma.card.update({
            where: { id: cardId }, data: { columnId: columnId }
        })
    }

    async uploadCoverCard(cardId: string, coverName: string) {
        this.cardGateway.notifyCard(cardId)
        return this.prisma.card.update({
            where: { id: cardId }, data: { cover: coverName }
        })
    }

    async createCheckList(cardId: string, title: string) {
        this.cardGateway.notifyCard(cardId)
        const card = await this.prisma.card.findUnique({
            where: { id: cardId }
        })
        if (!card) throw new NotFoundException("Card not found")

        const existCheckList = await this.prisma.checklist.findFirst({
            where: {
                cardId, title: {
                    equals: title, mode: "insensitive"
                }
            }
        })
        if (existCheckList) {
            throw new BadRequestException("A checklist with this title already exists in the card.");
        }

        this.cardGateway.notifyCard(cardId)

        const newCheckList = await this.prisma.checklist.create({
            data: {
                title,
                cardId,
            },
        });

        return newCheckList;
    }

    async addItemToCheckList(checkListId: string, text: string) {
        const checkList = await this.prisma.checklist.findUnique({
            where: { id: checkListId }
        })
        if (!checkList) throw new NotFoundException("Check list not found")
        const newItem = await this.prisma.checklistItem.create({
            data: {
                text: text,
                checklistId: checkListId
            }
        })
        this.cardGateway.notifyCard(checkList?.cardId)
        return newItem
    }

    async toggleChecklistItem(itemId: string) {
        const item = await this.prisma.checklistItem.findUnique({
            where: { id: itemId },
        });

        if (!item) throw new NotFoundException('Item not found');

        const updatedItem = await this.prisma.checklistItem.update({
            where: { id: itemId },
            data: {
                isChecked: !item.isChecked,
            },
        });

        return updatedItem;
    }

    async removeCheckList(checkListId: string) {
        const checkList = await this.prisma.checklist.findUnique({
            where: { id: checkListId },
        });

        if (!checkList) {
            throw new NotFoundException('Checklist not found');
        }
        await this.prisma.checklist.delete({
            where: { id: checkListId },
        });
    }

    async removeCheckListItem(itemId: string) {
        const item = await this.prisma.checklistItem.findUnique({
            where: { id: itemId },
        });

        if (!item) {
            throw new NotFoundException('Checklist item not found');
        }
        await this.prisma.checklistItem.delete({
            where: { id: itemId },
        });
    }

    async editDates(cardId: string, start: Date, due: Date) {
        const card = await this.prisma.card.findUnique({
            where: { id: cardId }
        })
        if (!card) throw new NotFoundException("Card not found")
        this.cardGateway.notifyCard(cardId)
        await this.prisma.card.update({
            where: { id: cardId },
            data: {
                startDate: new Date(start),
                dueDate: new Date(due),
            }
        })

    }

    async completeCard(cardId: string, iscomplete: boolean) {
        const card = await this.prisma.card.findUnique({
            where: { id: cardId }
        })
        if (!card) throw new NotFoundException("Card not found")

        await this.prisma.card.update({
            where: { id: cardId },
            data: {
                isComplete: iscomplete
            }
        })
        this.cardGateway.notifyCard(cardId)
    }

    async joinCard(cardId: string, userId: string) {
        const card = await this.prisma.card.findUnique({
            where: { id: cardId },
        });

        if (!card) {
            throw new NotFoundException("Card not found");
        }
        const existingMember = await this.prisma.boardMember.findFirst({
            where: {
                boardId: card.boardId,
                userId: userId,
            },
        });

        if (!existingMember) {
            await this.prisma.boardMember.create({
                data: {
                    boardId: card.boardId,
                    userId: userId,
                },
            });

            await this.prisma.userBoardPreference.create({
                data: {
                    boardId: card.boardId,
                    userId: userId,
                },
            });
        }

        const existingMemberInCard = await this.prisma.cardMember.findFirst({
            where: {
                cardId: cardId,
                userId: userId,
            },
        });

        if (!existingMemberInCard) {
            await this.prisma.cardMember.create({
                data: {
                    cardId: cardId,
                    userId: userId,
                },
            });
        }
        this.cardGateway.notifyCard(cardId)
        return { message: "Joined card successfully" };
    }

    async leaveCard(cardId: string, userId: string) {
        const card = await this.prisma.card.findUnique({
            where: { id: cardId },
        });

        await this.prisma.cardMember.delete({
            where: {
                cardId_userId: {
                    cardId: cardId,
                    userId: userId
                }
            }
        })
        this.cardGateway.notifyCard(cardId)

        return { message: "Leave card successfully" };
    }

    async addMemberToCard(cardId: string, userId: string) {
        const card = await this.prisma.card.findUnique({
            where: { id: cardId },
        });

        if (!card) {
            throw new NotFoundException("Card not found");
        }

        const existingMember = await this.prisma.cardMember.findFirst({
            where: { cardId, userId },
        });

        if (!existingMember) {
            await this.prisma.cardMember.create({
                data: { cardId, userId },
            });
        }
        this.cardGateway.notifyCard(cardId)

        return { message: "Joined card successfully" };
    }

    async removeMemberFromCard(cardId: string, userId: string) {
        const card = await this.prisma.card.findUnique({
            where: { id: cardId },
        });

        if (!card) {
            throw new NotFoundException("Card not found");
        }

        const existingMember = await this.prisma.cardMember.findFirst({
            where: { cardId, userId },
        });

        if (existingMember) {
            await this.prisma.cardMember.delete({
                where: {
                    cardId_userId: {
                        cardId: cardId,
                        userId: userId
                    }
                }
            });
        }
        this.cardGateway.notifyCard(cardId)

        return { message: "Removed member successfully" };
    }

}
