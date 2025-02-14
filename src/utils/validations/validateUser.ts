import { BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export async function validateUser(prisma: PrismaService, userId: string) {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        }
    })
    if (!user) throw new BadRequestException(`User with ID ${userId} does not exist`)
}