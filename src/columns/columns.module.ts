import { Module } from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { ColumnsController } from './columns.controller';
import { AppGateway } from '../gateways/app.gateway';

@Module({
  providers: [ColumnsService, AppGateway],
  controllers: [ColumnsController]
})
export class ColumnsModule {}
