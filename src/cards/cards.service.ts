import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { cardDTO } from './dto/card.dto';
import { AppGateway } from '../gateways/app.gateway';
import { ActivityAction, AttachmentType, NotificationType } from '@prisma/client';
import { extractMentionIdsFromHtml } from '../utils/formatters/extractMentionIdsFromHtml';

@Injectable()
export class CardsService {
    constructor(private prisma: PrismaService, private readonly appGateWay: AppGateway) { }

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

            this.appGateWay.notifyBoard(cardDTO.boardId)

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

    async getCardById(cardId: string) {
        return this.prisma.card.findUnique({
            where: { id: cardId },
            include: {
                labels: {
                    include: {
                        label: true
                    }
                },
                checklists: {
                    include: { items: true }
                },
                CardMembers: {
                    include: { user: true }
                },
                attachments: true,
                comments: { include: { user: true } },
                Activity: { include: { user: true } }
            }
        })
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
        const card = await this.prisma.card.update({
            where: { id: cardId },
            data: { columnId }
        });

        if (card.boardId) {
            this.appGateWay.notifyBoard(card.boardId);
        }

        return card;
    }


    async uploadCoverCard(cardId: string, coverName: string) {
        const card = await this.prisma.card.update({
            where: { id: cardId }, data: { cover: coverName }
        })

        if (card.id) {
            this.appGateWay.notifyCard(card.id);
        }

        return card;
    }

    async createCheckList(cardId: string, title: string) {
        const card = await this.prisma.card.findUnique({
            where: { id: cardId },
            select: { boardId: true }
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
        const newCheckList = await this.prisma.checklist.create({
            data: {
                title,
                cardId,
            },
        });

        if (card.boardId) {
            this.appGateWay.notifyBoard(card.boardId);
        }

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

        const card = await this.prisma.card.findUnique({
            where: { id: checkList.cardId },
            select: { boardId: true },
        });
        if (!card) throw new NotFoundException("Card not found")
        if (card.boardId) {
            this.appGateWay.notifyBoard(card.boardId);
        }
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

        const checkList = await this.prisma.checklist.findUnique({
            where: { id: item?.checklistId }
        })

        const card = await this.prisma.card.findUnique({
            where: { id: checkList.cardId },
            select: { boardId: true },
        });

        if (!card) throw new NotFoundException("Card not found")
        if (card.boardId) {
            this.appGateWay.notifyBoard(card.boardId);
        }

        return updatedItem;
    }

    async removeCheckList(checkListId: string) {
        const checkList = await this.prisma.checklist.findUnique({
            where: { id: checkListId },
        });

        if (!checkList) {
            throw new NotFoundException('Checklist not found');
        }

        const card = await this.prisma.card.findUnique({
            where: { id: checkList.cardId },
            select: { boardId: true },
        });

        if (!card) throw new NotFoundException("Card not found")
        if (card.boardId) {
            this.appGateWay.notifyBoard(card.boardId);
        }

        return await this.prisma.checklist.delete({
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

        const checkList = await this.prisma.checklist.findUnique({
            where: { id: item?.checklistId }
        })

        const card = await this.prisma.card.findUnique({
            where: { id: checkList.cardId },
            select: { boardId: true },
        });

        if (!card) throw new NotFoundException("Card not found")
        if (card.boardId) {
            this.appGateWay.notifyBoard(card.boardId);
        }
        return await this.prisma.checklistItem.delete({
            where: { id: itemId },
        });
    }

    async editDates(cardId: string, start: Date, due: Date) {
        const card = await this.prisma.card.findUnique({
            where: { id: cardId }
        })
        if (!card) throw new NotFoundException("Card not found")
        if (card.boardId) {
            this.appGateWay.notifyBoard(card.boardId);
        }
        return await this.prisma.card.update({
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
        });

        if (!card) throw new NotFoundException("Card not found");
        await this.prisma.card.update({
            where: { id: cardId },
            data: {
                isComplete: iscomplete
            }
        });
        const cardMembers = await this.prisma.cardMember.findMany({
            where: { cardId },
            select: { userId: true }
        });

        const memberIds = cardMembers.map((m) => m.userId);
        for (const memberId of memberIds) {
            await this.prisma.activity.create({
                data: {
                    action: iscomplete ? "COMPLETE_CARD" : "INCOMPLETE_CARD",
                    cardId: cardId,
                    userId: userId
                }
            });
            await this.prisma.notification.create({
                data: {
                    type: iscomplete ? NotificationType.COMPLETE_CARD : NotificationType.INCOMPLETE_CARD,
                    data: {
                        cardId: cardId,
                        cardName: card.title
                    },
                    actorId: userId,
                    targetUserId: memberId
                }
            });
            this.appGateWay.notifyUser(memberId);
        }
        if (card.boardId) {
            this.appGateWay.notifyBoard(card.boardId);
        }
        return { message: "COMPLETE_CARD" };
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

        if (card.boardId) {
            this.appGateWay.notifyBoard(card.boardId);
        }

        return { message: "Joined card successfully" };
    }

    async leaveCard(cardId: string, userId: string) {
        await this.prisma.cardMember.delete({
            where: {
                cardId_userId: {
                    cardId,
                    userId,
                },
            },
        });

        await this.prisma.activity.create({
            data: {
                action: "LEAVED_CARD",
                cardId,
                userId,
            },
        });

        const card = await this.prisma.card.findUnique({
            where: { id: cardId },
            select: {
                boardId: true,
                title: true,
                CardMembers: {
                    select: { userId: true },
                },
            },
        });

        if (!card) {
            throw new NotFoundException("Card not found");
        }

        const otherMembers = card.CardMembers.filter((member) => member.userId !== userId);

        await Promise.all(
            otherMembers.map((member) =>
                this.prisma.notification.create({
                    data: {
                        type: NotificationType.LEAVED_CARD,
                        data: {
                            cardId: cardId,
                            cardName: card.title,
                        },
                        actorId: userId,
                        targetUserId: member.userId,
                    },
                })
            )
        );
        otherMembers.forEach((member) => {
            this.appGateWay.notifyUser(member.userId);
        });

        if (card.boardId) {
            this.appGateWay.notifyBoard(card.boardId);
        }

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

            await this.prisma.notification.create({
                data: {
                    type: NotificationType.ADDED_TO_CARD,
                    data: {
                        cardId: cardId,
                        cardName: card?.title
                    },
                    actorId: ownerId,
                    targetUserId: userId
                }
            })
            this.appGateWay.notifyUser(userId);
        }

        if (card.boardId) {
            this.appGateWay.notifyBoard(card.boardId);
        }

        return { message: "Joined card successfully" };
    }

    async removeMemberFromCard(cardId: string, userId: string, actorId: string) {
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

        await this.prisma.notification.create({
            data: {
                type: NotificationType.REMOVED_FROM_CARD,
                data: {
                    cardId: cardId,
                    cardName: card?.title
                },
                actorId: actorId,
                targetUserId: userId
            }
        })

        this.appGateWay.notifyUser(userId);
        if (card.boardId) {
            this.appGateWay.notifyBoard(card.boardId);
        }

        return { message: "Removed member successfully" };
    }

    async uploadAttachmentPath(cardId: string,
        type: string,
        filePaths: string[],
        userId: string,
        filenames?: string[]) {
        const attachments = filePaths.map((fileUrl, index) => ({
            fileUrl,
            type: type === 'DRIVER' ? AttachmentType.DRIVER : AttachmentType.LOCAL,
            fileName: filenames?.[index] || fileUrl.split("\\").pop() || fileUrl.split("/").pop(),
            cardId,
            userId,
        }));

        await this.prisma.attachment.createMany({
            data: attachments,
        });

        const activities = filePaths.map((filePath, index) => ({
            action: ActivityAction.UPLOAD_ATTACHMENT,
            data: {
                fileName: filenames?.[index] || filePath.split("\\").pop() || filePath.split("/").pop(),
            },
            cardId,
            userId,
        }));

        await this.prisma.activity.createMany({
            data: activities,
        });
        const card = await this.prisma.card.findUnique({
            where: { id: cardId },
            select: { boardId: true }
        });

        if (!card) {
            throw new NotFoundException("Card not found");
        }
        if (card.boardId) {
            this.appGateWay.notifyBoard(card.boardId);
        }

        return { message: 'Attachments uploaded successfully' };
    }

    async uploadDescripton(cardId: string, content: string) {
        const card = await this.prisma.card.findUnique({
            where: { id: cardId }
        })

        if (!card) {
            throw new NotFoundException("Card not found");
        }
        if (card.id) {
            this.appGateWay.notifyCard(card.id);
        }
        return await this.prisma.card.update({
            where: { id: cardId },
            data: { description: content }
        })
    }

    async addComments(cardId: string, content: string, userId: string) {
        const card = await this.prisma.card.findUnique({
            where: { id: cardId },
            select: { boardId: true }
        });
        if (!card) throw new NotFoundException("Card not found");

        const comment = await this.prisma.comment.create({
            data: {
                cardId,
                content,
                userId
            },
        });

        const mentionedIds = extractMentionIdsFromHtml(content).filter(id => id !== userId);

        if (mentionedIds.length > 0) {
            const notifications = mentionedIds.map((ids) => ({
                type: NotificationType.TAGGED_IN_COMMENT,
                commentId: comment.id,
                actorId: userId,
                targetUserId: ids,
                data: {
                    cardId,
                    boardId: card?.boardId
                }
            }));
            for (const id of mentionedIds) {
                this.appGateWay.notifyUser(id);
            }
            await this.prisma.notification.createMany({ data: notifications });
        }

        if (card.boardId) {
            this.appGateWay.notifyBoard(card.boardId);
        }

        return comment;
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

        const card = await this.prisma.card.findUnique({
            where: { id: comment.cardId },
            select: { boardId: true }
        });

        if (!card) {
            throw new NotFoundException("Card not found");
        }

        // Cập nhật comment
        const updatedComment = await this.prisma.comment.update({
            where: { id: commentId },
            data: { content: newContent },
        });

        // Xử lý tag mention mới
        const mentionedIds = extractMentionIdsFromHtml(newContent).filter(id => id !== userId);

        if (mentionedIds.length > 0) {
            const notifications = mentionedIds.map((targetUserId) => ({
                type: NotificationType.TAGGED_IN_COMMENT,
                commentId: commentId,
                actorId: userId,
                targetUserId,
                data: {
                    cardId: comment.cardId,
                    boardId: card.boardId
                }
            }));

            for (const id of mentionedIds) {
                this.appGateWay.notifyUser(id);
            }

            await this.prisma.notification.createMany({ data: notifications });
        }

        if (card.boardId) {
            this.appGateWay.notifyBoard(card.boardId);
        }

        return updatedComment;
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


        const card = await this.prisma.card.findUnique({
            where: { id: comment?.cardId },
            select: { boardId: true }
        });
        if (!card) {
            throw new NotFoundException("Card not found");
        }
        if (card.boardId) {
            this.appGateWay.notifyBoard(card.boardId);
        }

        return this.prisma.comment.delete({
            where: { id: commentId },
        });
    }

}
