import { HttpException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { validateUser } from '../utils/validations';

@Injectable()
export class WorkspaceService {
    constructor(private prisma: PrismaService) { }

    async createWorkspace(userId: string, body: { title: string }) {
        try {
            await validateUser(this.prisma, userId)

            const newWorkspace = await this.prisma.workspace.create({
                data: {
                    name: body.title,
                    ownerId: userId,
                    members: {
                        create: [{ userId: userId }]
                    }
                }, include: {
                    members: true
                }
            })

            return {
                success: true,
                message: "Create workspace success",
                data: newWorkspace,
            };
        } catch (error) {
            console.error('Error creating workspace:', error);
            throw new InternalServerErrorException(error.message);
        }
    }

    async getWorkSpaceByUser(userId: string) {
        try {
            // await validateUser(this.prisma, userId);
            const workspaces = await this.prisma.workspace.findMany({
                where: {
                    OR: [
                        { ownerId: userId }, // User là chủ sở hữu
                        { members: { some: { userId: userId } } }, // User là thành viên
                    ],
                },
            });

            return workspaces
        } catch (error) {
            throw new HttpException(
                {
                    message: 'Error fetching workspaces',
                    error: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}