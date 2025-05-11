import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { AppGateway } from '../gateways/app.gateway';
@Module({
  providers: [WorkspaceService, AppGateway],
  controllers: [WorkspaceController]
})
export class WorkspaceModule {}
