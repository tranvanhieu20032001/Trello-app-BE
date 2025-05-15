import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { validateUser } from '../utils/validations';
import { AppGateway } from '../gateways/app.gateway';
import { NotificationType } from '@prisma/client';

@Injectable()
export class WorkspaceService {
    constructor(private prisma: PrismaService, private readonly appGateway: AppGateway) { }

    async createWorkspace(userId: string, body: { title: string }) {
        try {
            await validateUser(this.prisma, userId);
            const existingWorkspace = await this.prisma.workspace.findFirst({
                where: {
                    name: { equals: body.title, mode: "insensitive" },
                }
            })

            if (existingWorkspace) {
                throw new BadRequestException("This workspace name already exists, please choose another one.");
            }
            const newWorkspace = await this.prisma.workspace.create({
                data: {
                    name: body.title,
                    ownerId: userId,
                    members: { create: [{ userId }] }
                },
                include: { members: true }
            });

            return { success: true, message: "Create workspace success", data: newWorkspace };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getWorkSpaceByUser(userId: string) {
        try {
            await validateUser(this.prisma, userId);

            const workspaces = await this.prisma.workspace.findMany({
                where: {
                    OR: [
                        { ownerId: userId },
                        { members: { some: { userId } } }
                    ]
                }, include: {
                    members: {
                        include: {
                            user: {
                                include: {
                                    boards: true
                                }
                            }
                        }
                    }, boards: {
                        include: {
                            UserBoardPreference: true,
                            BoardMembers: true,
                            Card: true
                        }
                    }
                }
            });

            return { success: true, data: workspaces };
        } catch (error) {
            throw new HttpException("Error fetching workspaces", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    async getWorkspaceById(workspaceId: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                members: {
                    include: {
                        user: {
                            include: {
                                boards: true
                            }
                        }
                    }
                }, boards: {
                    include: {
                        UserBoardPreference: true,
                        BoardMembers: true,
                        Card: true
                    }
                }
            }
        })
        return {
            success: true,
            data: workspace
        }
    }

    async addMember(workspaceId: string, userId: string, actorId: string) {
        const existingMember = await this.prisma.workspaceMember.findFirst({
            where: { workspaceId, userId }
        });

        if (existingMember) {
            throw new BadRequestException('User is already a member of this workspace');
        }
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId }
        });

        if (!workspace) {
            throw new NotFoundException("Workspace does not exist.");
        }

        const workspaceMember = await this.prisma.workspaceMember.create({
            data: {
                userId,
                workspaceId
            }
        });
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        await this.prisma.notification.create({
            data: {
                type: NotificationType.ADDED_TO_WORKSPACE,
                data: {
                    workSpaceId: workspaceId,
                    workSpaceName: workspace.name
                },
                actorId,
                targetUserId: userId
            }
        });

        this.appGateway.notifyUser(userId);
        this.appGateway.notifyNewMember("workspace", workspaceId, user?.username || "Unknown");

        return {
            message: 'Joined workspace successfully',
            data: workspaceMember
        };
    }


    async searchUser(query: string) {
        return this.prisma.user.findMany({
            where: {
                OR: [
                    { email: { contains: query, mode: 'insensitive' } },
                    { username: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: { id: true, username: true, email: true, avatar: true }
        })
    }


    async updateWorkspaceName(workspaceId: string, userId: string, newName) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId }
        })

        if (!workspace || workspace.ownerId !== userId) {
            throw new Error("You do not have permission to edit this workspace.");
        }

        return {
            message: "Update workspace name successfully",
            data: await this.prisma.workspace.update({
                where: { id: workspaceId },
                data: { name: newName }
            })
        };

    }

    async leaveWorkspace(workspaceId: string, userId: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true }
        });

        if (!workspace) {
            throw new NotFoundException("workspace does not exist");
        }

        if (userId === workspace.ownerId) {
            const newOwner = workspace.members.find(member => member.userId !== userId);
            if (newOwner) {
                await this.prisma.workspace.update({
                    where: { id: workspaceId },
                    data: { ownerId: newOwner.userId }
                });
            } else {
                await this.prisma.workspace.delete({
                    where: { id: workspaceId }
                });

                return { message: "The workspace has been deleted because there are no members left." };
            }
        }

        await this.prisma.workspaceMember.deleteMany({
            where: {
                workspaceId,
                userId
            }
        });

        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        const otherMembers = workspace.members.filter(member => member.userId !== userId);

        await Promise.all(
            otherMembers.map(member =>
                this.prisma.notification.create({
                    data: {
                        type: NotificationType.LEAVED_WORKSPACE,
                        data: {
                            workSpaceId: workspaceId,
                            workSpaceName: workspace.name
                        },
                        actorId: userId,
                        targetUserId: member.userId
                    }
                })
            )
        );

        otherMembers.forEach(member => this.appGateway.notifyUser(member.userId));
        this.appGateway.notifyLeaveMember("workspace", workspaceId, user.username);

        return {
            success: true,
            message: "You have successfully left the workspace."
        };
    }


    async removeMemberWorkspace(workspaceId: string, ownerId: string, userId: string, actorId: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true },
        });

        if (!workspace) {
            throw new NotFoundException("Workspace does not exist.");
        }

        if (workspace.ownerId !== ownerId) {
            throw new ForbiddenException("Only the workspace owner can remove members.");
        }

        if (ownerId === userId) {
            throw new BadRequestException("The owner cannot remove themselves from the workspace.");
        }

        const isMember = workspace.members.some(member => member.userId === userId);
        if (!isMember) {
            throw new BadRequestException("User is not a member of this workspace.");
        }

        await this.prisma.workspaceMember.deleteMany({
            where: {
                workspaceId: workspaceId,
                userId: userId
            }
        });

        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        })
        await this.prisma.notification.create({
            data: {
                type: NotificationType.REMOVE_FROM_WORKSPACE,
                data: {
                    workspaceId: workspaceId,
                    workSpaceName: workspace?.name,
                },
                actorId: actorId,
                targetUserId: userId,
            },
        });
        this.appGateway.notifyUser(userId);
        this.appGateway.notifyRemoveMember("workspace", workspaceId, user.username)

        return {
            success: true,
            message: "The user has been successfully removed from the workspace."
        };
    }

}
