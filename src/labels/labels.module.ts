import { Module } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { LabelsController } from './labels.controller';
import { AppGateway } from '../gateways/app.gateway';

@Module({
  providers: [LabelsService, AppGateway],
  controllers:[LabelsController]
})
export class LabelsModule {}
