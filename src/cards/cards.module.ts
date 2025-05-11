import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { AppGateway } from '../gateways/app.gateway';
@Module({
  providers: [CardsService, AppGateway],
  controllers: [CardsController]
})
export class CardsModule {}
