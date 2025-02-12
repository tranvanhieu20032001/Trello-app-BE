import { Injectable, HttpException, HttpStatus, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from "../prisma/prisma.service";
import { BoardDTO } from './dto';
import { slugify } from '../utils/formatters';
import { title } from 'process';

@Injectable()
export class BoardsService {
    constructor(private prisma: PrismaService) { }

    async createBoard(boardDTO: BoardDTO, userId: string) {
        try {
            const userExists = await this.prisma.user.findUnique({
                where: { id: userId },
            });

            if (!userExists) {
                throw new HttpException(
                    { message: "User does not exist", userId },
                    HttpStatus.BAD_REQUEST
                );
            }

            const newBoard = await this.prisma.board.create({
                data: {
                    title: boardDTO.title,
                    description: boardDTO.description,
                    ownerId: userId,
                    slug: slugify(boardDTO.title),
                    type: boardDTO.type
                },
            });

            return {
                success:true,
                message: "Create Board success",
                data: newBoard,
            };
        } catch (error) {
            console.error("Error creating board:", error);

            throw new HttpException(
                { message: "Database error", error: error.message },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getBoardById(id: string) {
        if (!id) {
            throw new BadRequestException('Invalid board ID');
        }
    
        const board = await this.prisma.board.findUnique({
            where: { id },
            include:{
                columns:{
                    include:{
                        cards:true,
                    }
                }
            }
        });
    
        if (!board) {
            throw new NotFoundException('Board not found');
        }
    
        return {
            success: true,
            data: board,
        };
    }
    
}
