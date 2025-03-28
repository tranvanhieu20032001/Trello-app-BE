import { Injectable } from "@nestjs/common";
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@Injectable()
@WebSocketGateway({ cors: { origin: "*" } })
export class WorkspaceGateway {
    @WebSocketServer() server: Server;

    sendNotification(workspaceId: string, message: string) {
        this.server.to(workspaceId).emit('workspace_notification', { message });
    }

    @SubscribeMessage('join_workspace')
    handleJoin(@MessageBody() data: { userId: string; workspaceId: string }) {
        this.sendNotification(data.workspaceId, `User ${data.userId} has joined workspace`);
    }

    @SubscribeMessage('leave_workspace')
    handleLeave(@MessageBody() data: { userId: string; workspaceId: string }) {
        this.sendNotification(data.workspaceId, `User ${data.userId} has left workspace`);
    }

    @SubscribeMessage('remove_workspace')
    handleRemove(@MessageBody() data: { userId: string; workspaceId: string }) {
        this.sendNotification(data.workspaceId, `User ${data.userId} was removed by admin`);
    }
}
