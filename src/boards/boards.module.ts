import { Module } from '@nestjs/common';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { BoardGateway } from '../gateways/board.gateway';

@Module({
  controllers: [BoardsController],
  providers: [BoardsService, BoardGateway]
})
export class BoardsModule {}
