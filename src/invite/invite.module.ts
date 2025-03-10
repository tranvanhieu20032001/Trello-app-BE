import { Module } from '@nestjs/common';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';

@Module({
  providers: [InviteService],
  controllers: [InviteController]
})
export class InviteModule {}
