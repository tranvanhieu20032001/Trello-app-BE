import { Module } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { LabelsController } from './labels.controller';
import { CardGateway } from '../gateways/card.gateway';
import { BoardGateway } from '../gateways/board.gateway';

@Module({
  providers: [LabelsService, CardGateway, BoardGateway],
  controllers:[LabelsController]
})
export class LabelsModule {}
