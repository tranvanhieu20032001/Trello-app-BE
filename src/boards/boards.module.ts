import { Module } from '@nestjs/common';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { AppGateway } from '../gateways/app.gateway';

@Module({
  controllers: [BoardsController],
  providers: [BoardsService, AppGateway]
})
export class BoardsModule {}
