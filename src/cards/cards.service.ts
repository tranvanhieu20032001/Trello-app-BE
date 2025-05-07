import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { cardDTO } from './dto/card.dto';
import { CardGateway } from '../gateways/card.gateway';
import { ColumnGateway } from '../gateways/column.gateway';
import { Prisma } from '@prisma/client';

@Injectable()
export class CardsService {
    constructor(private prisma: PrismaService, private cardGateway: CardGateway, private columnGateway: ColumnGateway) { }

    async createCard(cardDTO: cardDTO, userId: string) {
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
                select: { cardOrderIds: true, title: true }
            })
            if (!column) {
                throw new Error("Column not found");
            }

            const updateCardOrder = column.cardOrderIds.includes(newCard.id) ? column.cardOrderIds : [...column.cardOrderIds, newCard.id]
            await this.prisma.column.update({
                where: { id: cardDTO.columnId },
                data: { cardOrderIds: updateCardOrder }
            })

            await this.prisma.activity.create({
                data: {
                    action: "CARD_CREATED",
                    data: {
                        columnTitle: column?.title
                    },
                    cardId: newCard.id,
                    userId: userId
                }
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

    async updateCardTitle(cardId: string, newTitle: string) {
        await this.prisma.card.update({
            where: { id: cardId },
            data: {
                title: newTitle
            }
        })
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

    async completeCard(cardId: string, iscomplete: boolean, userId: string) {
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
        if (iscomplete) {
            await this.prisma.activity.create({
                data: {
                    action: "COMPLETE_CARD",
                    cardId: cardId,
                    userId: userId
                }
            })
        } else {
            await this.prisma.activity.create({
                data: {
                    action: "INCOMPLETE_CARD",
                    cardId: cardId,
                    userId: userId
                }
            })
        }
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
        await this.prisma.activity.create({
            data: {
                action: "JOINED_CARD",
                cardId: cardId,
                userId: userId
            }
        })
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

        await this.prisma.activity.create({
            data: {
                action: "LEAVED_CARD",
                cardId: cardId,
                userId: userId
            }
        })
        this.cardGateway.notifyCard(cardId)

        return { message: "Leave card successfully" };
    }

    async addMemberToCard(cardId: string, userId: string, ownerId: string) {
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
        if (ownerId === userId) {
            await this.prisma.activity.create({
                data: {
                    action: "JOINED_CARD",
                    cardId: cardId,
                    userId: userId
                }
            })
        } else {
            const user = await this.prisma.user.findUnique({ where: { id: userId } })
            await this.prisma.activity.create({
                data: {
                    action: "ADD_MEMBER",
                    data: {
                        memberName: user?.username
                    },
                    cardId: cardId,
                    userId: ownerId
                }
            })
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

    async uploadAttachmentPath(cardId: string, filePaths: string[], userId: string) {
        const attachments = filePaths.map((fileUrl) => ({
            fileUrl,
            cardId,
            userId
        }));
        await this.prisma.attachment.createMany({
            data: attachments,
        });

        const activities = filePaths.map((filePath) => ({
            action: "UPLOAD_ATTACHMENT",
            data: {
                fileName: filePath.split("\\").pop(),
            },
            cardId,
            userId,
        }));

        await this.prisma.activity.createMany({
            data: activities,
        });


        return { message: 'Attachments uploaded successfully' };
    }

    async uploadDescripton(cardId: string, content: string) {
        const card = this.prisma.card.findUnique({
            where: { id: cardId }
        })

        if (!card) {
            throw new NotFoundException("Card not found");
        }
        await this.prisma.card.update({
            where: { id: cardId },
            data: { description: content }
        })
    }

    async addComments(cardId: string, content: string, userId: string) {
        return this.prisma.comment.create({
            data: {
                cardId,
                content,
                userId
            },
        });
        
    }

    async editComment(commentId: string, newContent: string, userId: string) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        if (comment.userId !== userId) {
            throw new ForbiddenException('You can only edit your own comment');
        }

        return this.prisma.comment.update({
            where: { id: commentId },
            data: { content: newContent },
        });
    }

    async deleteComment(commentId: string, userId: string) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        if (comment.userId !== userId) {
            throw new ForbiddenException('You can only delete your own comment');
        }

        return this.prisma.comment.delete({
            where: { id: commentId },
        });
    }


}
