import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceGateway } from '../gateways/workspace.gateway';

@Module({
  providers: [WorkspaceService, WorkspaceGateway],
  controllers: [WorkspaceController]
})
export class WorkspaceModule {}
