import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AppGateway.name);

  @WebSocketServer() server: Server;

  private connectedClients: Map<string, Socket> = new Map();

  afterInit() {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client);
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /** ===== JOIN ROOMS ===== */
  @SubscribeMessage('joinWorkspace')
  handleJoinWorkspace(client: Socket, workspaceId: string) {
    client.join(`workspace-${workspaceId}`);
  }

  @SubscribeMessage('joinBoard')
  handleJoinBoard(client: Socket, boardId: string) {
    client.join(`board-${boardId}`);
  }

  @SubscribeMessage('joinColumn')
  handleJoinColumn(client: Socket, boardId: string) {
    client.join(`column-${boardId}`);
  }

  @SubscribeMessage('joinCard')
  handleJoinCard(client: Socket, cardId: string) {
    client.join(`card-${cardId}`);
  }

  @SubscribeMessage('joinUser')
  handleJoinUser(client: Socket, userId: string) {
    client.join(`user-${userId}`);
  }


  /** ===== NOTIFY EVENTS ===== */

  notifyNewMember(scope: 'workspace' | 'board', id: string, username: string) {
    this.server.to(`${scope}-${id}`).emit('new-member', username);
  }

  notifyRemoveMember(scope: 'workspace' | 'board', id: string, username: string) {
    this.server.to(`${scope}-${id}`).emit('remove-member', username);
  }

  notifyLeaveMember(scope: 'workspace' | 'board', id: string, username: string) {
    this.server.to(`${scope}-${id}`).emit('leave-member', username);
  }

  notifyWorkspace(workspaceId: string) {
    this.server.to(`workspace-${workspaceId}`).emit('notify');
  }

  notifyBoard(boardId: string) {
    this.server.to(`board-${boardId}`).emit('notify');
  }

  notifyColumn(boardId: string) {
    this.server.to(`board-${boardId}`).emit('notify');
  }


  notifyCard(cardId: string) {
    this.server.to(`card-${cardId}`).emit('notify');
  }

  notifyUpdateColumnOrder(boardId: string) {
    this.server.to(`board-${boardId}`).emit('updateColumnOrder');
  }

  notifyUpdateOrderCardIds(boardId: string) {
    this.server.to(`column-${boardId}`).emit('updateOrderCardIds');
  }

  notifyBoardChange(boardId: string) {
    this.server.to(`column-${boardId}`).emit('notifyBoard');
  }

  notifyUser(userId: string) {
  this.server.to(`user-${userId}`).emit('notification');
}
}
