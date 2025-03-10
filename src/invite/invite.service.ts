import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InviteService {
    constructor(private prisma: PrismaService, private config: ConfigService) { }

    async createInvite(workspaceId: string) {
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const invite = await this.prisma.invite.create({
            data: {
                workspaceId,
                token,
                expiresAt,
            },
        });

        return { link: `${this.config.get("FE_URL")}/invite/${invite.token}` };
    }

    async verifyInvite(token: string) {
        const invite = await this.prisma.invite.findFirst({
            where: { token, expiresAt: { gt: new Date() } }
        })
        if (!invite) throw new NotFoundException('Invite link is invalid or expired');
        return { message: 'Valid invite', workspaceId: invite.workspaceId }
    }
}
