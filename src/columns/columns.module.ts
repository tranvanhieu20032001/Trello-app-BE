import { Module } from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { ColumnsController } from './columns.controller';
import { ColumnGateway } from '../gateways/column.gateway';

@Module({
  providers: [ColumnsService, ColumnGateway],
  controllers: [ColumnsController]
})
export class ColumnsModule {}
