import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { CardGateway } from '../gateways/card.gateway';
import { ColumnGateway } from '../gateways/column.gateway';

@Module({
  providers: [CardsService, CardGateway, ColumnGateway],
  controllers: [CardsController]
})
export class CardsModule {}
