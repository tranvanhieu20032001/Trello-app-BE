import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InviteService {
    constructor(private prisma: PrismaService, private config: ConfigService) { }

    async createInvite({ workspaceId, boardId }: { workspaceId?: string; boardId?: string }) {
        if (!workspaceId && !boardId) {
            throw new Error("Must provide either workspaceId or boardId");
        }

        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);

        const invite = await this.prisma.invite.create({
            data: {
                workspaceId,
                boardId,
                token,
                expiresAt,
            },
        });

        const type = workspaceId ? "wp" : "b";
        return { link: `${this.config.get("FE_URL")}/invite/${type}/${invite.token}` };
    }


    async verifyInvite(token: string) {
        const invite = await this.prisma.invite.findFirst({
            where: { token, expiresAt: { gt: new Date() } }
        });

        if (!invite) {
            throw new NotFoundException('Invite link is invalid or expired');
        }

        return {
            message: 'Valid invite',
            workspaceId: invite.workspaceId,
            boardId: invite.boardId
        };
    }
}
