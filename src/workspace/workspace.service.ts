import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { validateUser } from '../utils/validations';
import { contains } from 'class-validator';

@Injectable()
export class WorkspaceService {
    constructor(private prisma: PrismaService) { }

    async createWorkspace(userId: string, body: { title: string }) {
        try {
            await validateUser(this.prisma, userId);
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
                members:{
                    include:{
                        user:{
                            include:{
                                boards:true
                            }
                        }
                    }
                }
            }
        })
        return {
            success: true,
            data: workspace
        }
    }

    async addMember(workspaceId: string, userId: string) {
        const existingMember = await this.prisma.workspaceMember.findFirst({
            where: { workspaceId, userId }
        });

        if (existingMember) {
            throw new BadRequestException('User is already a member of this workspace');
        }

        const workspaceMember = await this.prisma.workspaceMember.create({
            data: {
                userId,
                workspaceId
            }
        });

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
}
