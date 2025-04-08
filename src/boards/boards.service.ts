import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from "../prisma/prisma.service";
import { BoardDTO } from './dto';
import { slugify } from '../utils/formatters';
import { validateUser } from '../utils/validations';

@Injectable()
export class BoardsService {
    constructor(private prisma: PrismaService) { }

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
                        cards: true,
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
                }
            }
        });

        if (!board) {
            throw new NotFoundException('Board not found');
        }

        return {
            success: true,
            data: {
                ...board,
                starred: board.UserBoardPreference.length > 0 ? board.UserBoardPreference[0].starred : false
            },
        };
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
            throw new ForbiddenException("Only the workspace owner can remove members.")
        }

        return {
            success: true,
            message: "Board closed successfully",
            data: board,
        };

    }

    async reOpenBoard(boardId: string) {
        if (!boardId) {
            throw new BadRequestException('Invalid board ID');
        }

        const board = await this.prisma.board.update({
            where: { id: boardId },
            data: { status: true }
        })

        return {
            success: true,
            message: "Board closed successfully",
            data: board,
        };

    }


    async addMember(boardId: string, userId: string) {
        const existingMember = await this.prisma.boardMember.findFirst({
            where: { boardId, userId }
        });

        if (existingMember) {
            throw new BadRequestException('User is already a member of this board');
        }

        const boardMember = await this.prisma.boardMember.create({
            data: {
                userId,
                boardId
            }
        });

        await this.prisma.userBoardPreference.create({
            data: {
                userId,
                boardId
            }
        })

        return {
            message: 'Joined board successfully',
            data: boardMember
        };
    }

    async leaveBoard(boardId: string, userId: string) {
        const board = await this.prisma.board.findUnique({
            where: { id: boardId },
            include: { BoardMembers: true }
        })
        if (!board) {
            throw new Error("Board does not exist")
        }
        if (userId === board.ownerId) {
            const newOwner = board.BoardMembers.find(m => m.userId !== userId)
            if (newOwner) {
                await this.prisma.board.update({
                    where: { id: boardId },
                    data: { ownerId: newOwner.userId }
                })
            } else {
                await this.prisma.board.delete({
                    where: { id: boardId }
                })
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

        return {
            success: true,
            message: "The user has been successfully leave from board."
        };
    }

    async removeMemberBoar(boardId: string, ownerId: string, userId: string) {
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
    }

}
