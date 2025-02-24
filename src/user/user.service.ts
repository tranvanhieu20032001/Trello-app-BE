import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { validateUser } from '../utils/validations';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async getMe(userId: string) {
        await validateUser(this.prisma, userId);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        return user
    }
}
