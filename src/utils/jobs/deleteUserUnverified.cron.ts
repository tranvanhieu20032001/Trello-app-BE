import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeleteUserUnverifiedService {
  private readonly logger = new Logger(DeleteUserUnverifiedService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('20 1 * * *')
  async deleteUnverifiedUsers() {
    this.logger.log('Checking for unverified users to delete...');
    
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const deleted = await this.prisma.user.deleteMany({
      where: {
        isVerified: false,
        createdAt: { lt: expiredDate },
      },
    });

    this.logger.log(`Deleted ${deleted.count} unverified users.`);
  }
}
