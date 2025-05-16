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

    async getNotifications(userId: string) {
        await validateUser(this.prisma, userId);
        const notifications = await this.prisma.notification.findMany({
            where: { targetUserId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                actor: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            }
        })
        return notifications
    }

    async markAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: {
                targetUserId: userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
    }

    async markNotificationAsRead(notificationId: string) {
        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }



}
