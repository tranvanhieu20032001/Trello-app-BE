import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from "../prisma/prisma.service";
import { BoardDTO } from './dto';
import { slugify } from '../utils/formatters/formatters';
import { validateUser } from '../utils/validations';
import { AppGateway } from '../gateways/app.gateway';
import { NotificationType } from '@prisma/client';

@Injectable()
export class BoardsService {
    constructor(private prisma: PrismaService, private readonly appGateWay: AppGateway) { }

    async createBoard(boardDTO: BoardDTO, userId: string) {
        try {
            await validateUser(this.prisma, userId);
            const existingBoard = await this.prisma.board.findFirst({
                where: {
                    title: { equals: boardDTO.title, mode: "insensitive" },
                    workspaceId: boardDTO.workspaceId,
                },
            });

            if (existingBoard) {
                throw new BadRequestException("A board with this name already exists in the workspace.");
            }

            const newBoard = await this.prisma.board.create({
                data: {
                    title: boardDTO.title,
                    background: boardDTO.background,
                    ownerId: userId,
                    slug: slugify(boardDTO.title),
                    type: boardDTO.type,
                    workspaceId: boardDTO.workspaceId,
                    BoardMembers: { create: [{ userId }] }
                },
            });

            await this.prisma.userBoardPreference.create({
                data: {
                    userId: userId,
                    boardId: newBoard.id,
                    starred: false,
                },
            });

            this.appGateWay.notifyWorkspace(boardDTO.workspaceId)

            return {
                success: true,
                message: "Create Board success",
                data: newBoard,
            };
        } catch (error) {
            console.error("Error creating board:", error);
            throw new InternalServerErrorException(error.message);
        }
    }

    async getBoardById(id: string, userId: string) {
        if (!id) {
            throw new BadRequestException('Invalid board ID');
        }
        await validateUser(this.prisma, userId);

        const board = await this.prisma.board.findUnique({
            where: { id },
            include: {
                columns: {
                    include: {
                        cards: {
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
                        }

                    }
                },
                UserBoardPreference: {
                    where: { userId },
                    select: { starred: true }
                },
                BoardMembers: {
                    include: {
                        user: true
                    }
                }, labels: true
            }
        });
        if (!board) {
            throw new NotFoundException('Board not found');
        }


        const isMemberBoard = await this.prisma.boardMember.findUnique({
            where: {
                boardId_userId: {
                    boardId: id,
                    userId,
                },
            },
        });
        const isMemberWorkSpace = await this.prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId: board?.workspaceId,
                    userId,
                },
            },
        });
        const isPublic = board.type === 'public';

        const hasAccess =
            isPublic ||
            (board.type === 'private' && !!isMemberBoard) ||
            (board.type === 'workspace' && !!isMemberWorkSpace) ||
            (board.type === 'workspace' && !!isMemberBoard);
        if (hasAccess) {
            await this.prisma.boardRecent.upsert({
                where: {
                    boardId_userId: {
                        boardId: id,
                        userId,
                    },
                },
                update: {
                    recentAccessedAt: new Date(),
                },
                create: {
                    boardId: id,
                    userId,
                    recentAccessedAt: new Date(),
                },
            });
        }

        return {
            success: true,
            data: {
                ...board,
                starred: board.UserBoardPreference.length > 0 ? board.UserBoardPreference[0].starred : false
            },
        };
    }


    async getBoardRecent(userId: string) {
        const recent5 = await this.prisma.boardRecent.findMany({
            where: { userId },
            orderBy: { recentAccessedAt: 'desc' },
            take: 5,
            include: {
                board: {
                    include: {
                        UserBoardPreference: {
                            where: { userId },
                            select: { starred: true }
                        },
                    }
                },
            },
        });
        const boardIdsToKeep = recent5.map(r => r.boardId);

        await this.prisma.boardRecent.deleteMany({
            where: {
                userId,
                boardId: {
                    notIn: boardIdsToKeep,
                },
            },
        });

        return recent5;
    }

    async getBoardStarred(userId: string) {
        const starredBoards = await this.prisma.userBoardPreference.findMany({
            where: {
                userId,
                starred: true,
            },
            include: {
                board: true,
            },
        });
        return starredBoards.map((item) => item.board);
    }

    async closeBoard(boardId: string, userId: string) {
        if (!boardId) {
            throw new BadRequestException('Invalid board ID');
        }

        const board = await this.prisma.board.update({
            where: { id: boardId },
            data: { status: false }
        })
        if (board.ownerId !== userId) {
            throw new ForbiddenException("Only owner can close the board.")
        }

        this.appGateWay.notifyWorkspace(board.workspaceId)

        return {
            success: true,
            message: "Board closed successfully",
            data: board,
        };

    }

    async reOpenBoard(boardId: string, userId: string) {
        if (!boardId) {
            throw new BadRequestException('Invalid board ID');
        }

        const board = await this.prisma.board.update({
            where: { id: boardId },
            data: { status: true }
        })
        if (board?.ownerId !== userId) {
            throw new ForbiddenException('Only owner can reopen the board');
        }

        this.appGateWay.notifyWorkspace(board.workspaceId)

        return {
            success: true,
            message: "Board closed successfully",
            data: board,
        };

    }

    async deleteBoard(boardId: string, userId: string) {
        const board = await this.prisma.board.findUnique({
            where: { id: boardId },
        });

        if (!board) {
            throw new NotFoundException('Board does not exist');
        }

        if (board.ownerId !== userId) {
            throw new ForbiddenException('Only the board owner can remove the board.');
        }

        await this.prisma.board.delete({
            where: { id: boardId },
        });

        this.appGateWay?.notifyWorkspace(board.workspaceId);

        return {
            success: true,
            message: 'Board deleted successfully',
            boardId,
        };
    }

    async addMember(boardId: string, userId: string, actorId: string) {
        const existingMember = await this.prisma.boardMember.findFirst({
            where: { boardId, userId },
        });

        if (existingMember) {
            throw new BadRequestException('User is already a member of this board');
        }

        const boardMember = await this.prisma.boardMember.create({
            data: {
                userId,
                boardId,
            },
        });

        await this.prisma.userBoardPreference.create({
            data: {
                userId,
                boardId,
            },
        });
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        const board = await this.prisma.board.findUnique({
            where: { id: boardId },
        });

        await this.prisma.notification.create({
            data: {
                type: NotificationType.ADDED_TO_BOARD,
                data: {
                    boardId: boardId,
                    boardName: board?.title,
                },
                actorId: actorId,
                targetUserId: userId,
            },
        });
        this.appGateWay.notifyUser(userId);
        this.appGateWay.notifyNewMember('board', boardId, user.username);

        return {
            message: 'Joined board successfully',
            data: boardMember,
        };
    }

    async leaveBoard(boardId: string, userId: string) {
        const board = await this.prisma.board.findUnique({
            where: { id: boardId },
            include: { BoardMembers: true }
        });

        if (!board) {
            throw new Error("Board does not exist");
        }

        if (userId === board.ownerId) {
            const newOwner = board.BoardMembers.find(m => m.userId !== userId);
            if (newOwner) {
                await this.prisma.board.update({
                    where: { id: boardId },
                    data: { ownerId: newOwner.userId }
                });
            } else {
                await this.prisma.board.delete({
                    where: { id: boardId }
                });
            }
        }

        await this.prisma.boardMember.delete({
            where: {
                boardId_userId: {
                    boardId,
                    userId
                }
            }
        });
        await this.prisma.userBoardPreference.deleteMany({
            where: {
                boardId,
                userId
            }
        });

        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        const otherMembers = board.BoardMembers.filter(m => m.userId !== userId);
        await Promise.all(
            otherMembers.map(member =>
                this.prisma.notification.create({
                    data: {
                        type: NotificationType.LEAVED_BOARD,
                        data: {
                            boardId,
                            boardName: board.title
                        },
                        actorId: userId,
                        targetUserId: member.userId
                    }
                })
            )
        );

        otherMembers.forEach(member => this.appGateWay.notifyUser(member.userId));

        this.appGateWay.notifyLeaveMember("board", boardId, user.username);

        return {
            success: true,
            message: "The user has successfully left the board."
        };
    }


    async removeMemberBoard(boardId: string, ownerId: string, userId: string, actorId: string) {
        const board = await this.prisma.board.findUnique({
            where: { id: boardId },
            include: { BoardMembers: true }
        })
        if (!board) {
            throw new NotFoundException("Workspace does not exist.");
        }
        if (board.ownerId !== ownerId) {
            throw new ForbiddenException("Only the board owner can remove members.");
        }

        if (ownerId === userId) {
            throw new BadRequestException("The owner cannot remove themselves from the board.");
        }
        const isMember = board.BoardMembers.some(member => member.userId === userId);

        if (!isMember) {
            throw new BadRequestException("User is not a member of this board.");
        }
        await this.prisma.boardMember.deleteMany({
            where: {
                boardId: boardId,
                userId: userId
            }
        })

        await this.prisma.userBoardPreference.deleteMany({
            where: {
                boardId,
                userId
            }
        });

        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        })
        await this.prisma.notification.create({
            data: {
                type: NotificationType.REMOVE_FROM_BOARD,
                data: {
                    boardId: boardId,
                    boardName: board?.title,
                },
                actorId: actorId,
                targetUserId: userId,
            },
        });
        this.appGateWay.notifyUser(userId);
        this.appGateWay.notifyRemoveMember("board", boardId, user.username)

        return {
            success: true,
            message: "The user has been successfully removed from board."
        };
    }

    async changeVisibility(boardId: string, ownerId: string, visibility: string) {
        await validateUser(this.prisma, ownerId);
        const board = await this.prisma.board.findUnique({
            where: { id: boardId }
        })
        if (ownerId !== board.ownerId) {
            throw new ForbiddenException("User is not the owner of the board");
        }
        if (!board) throw new NotFoundException("Board not found")

        this.appGateWay.notifyBoard(boardId)
        return this.prisma.board.update({
            where: { id: boardId },
            data: { type: visibility }
        })
    }

    async changeTitleBoard(boardId: string, userId: string, newname: string) {
        await validateUser(this.prisma, userId);
        const board = await this.prisma.board.findUnique({
            where: { id: boardId }
        })

        if (!board) throw new NotFoundException("Board not found")
        if (board.ownerId !== userId) {
            throw new ForbiddenException("User is not the owner of the board");
        }
        const existingTitle = await this.prisma.board.findFirst({
            where: {
                title: { equals: newname, mode: "insensitive" },
            }
        })

        if (existingTitle) {
            throw new BadRequestException("This board name already exists, please choose another one.");
        }
        this.appGateWay.notifyBoard(boardId)
        return this.prisma.board.update({
            where: { id: boardId },
            data: { title: newname }
        })
    }

    async toggleStarred(boardId: string, userId: string) {
        await validateUser(this.prisma, userId);

        const boardMember = await this.prisma.boardMember.findUnique({
            where: {
                boardId_userId: {
                    boardId,
                    userId
                }
            }
        });

        if (!boardMember) {
            throw new ForbiddenException("User is not the member of the board");
        }

        const userPref = await this.prisma.userBoardPreference.findUnique({
            where: {
                userId_boardId: {
                    userId,
                    boardId
                }
            }
        });

        if (!userPref) {
            throw new NotFoundException("User preference not found");
        }

        // Toggle giá trị starred
        return this.prisma.userBoardPreference.update({
            where: {
                userId_boardId: {
                    userId,
                    boardId
                }
            },
            data: {
                starred: !userPref.starred
            }
        });
    }

    async updateColumnOrder(boardId: string, columnOrderIds: string[]) {
        const board = this.prisma.board.findUnique({
            where: { id: boardId },
        })
        if (!board) throw new NotFoundException("Board not found")

        await this.prisma.board.update({
            where: { id: boardId },
            data: { columnOrderIds: columnOrderIds }
        })
        this.appGateWay.notifyBoard(boardId)
    }

}
