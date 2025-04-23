import { Logger } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class WorkspaceGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(WorkspaceGateway.name);

    @WebSocketServer() server: Server;
    private connectedClients: Map<string, Socket> = new Map();

    afterInit() {
        this.logger.log("Initialized")
    }

    handleConnection(client: Socket, ...args: any[]) {
        this.connectedClients.set(client.id, client);
        console.log(`Client connected:${client.id}`);
    }
    handleDisconnect(client: Socket) {
        this.connectedClients.delete(client.id)
        console.log(`Client disconnected: ${client.id}`);

    }

    @SubscribeMessage('joinWorkspace')
    handleJoinWorkspace(client: Socket, workspaceId: string): void {
        client.join(workspaceId);
        // console.log(`Client ${client.id} joined workspace ${workspaceId}`);
    }

    notifyNewMember(workspaceId: string, username: string) {
        this.server.to(workspaceId).emit('new-member', username);
        // this.logger.log(`Notified workspace ${workspaceId} about new member ${member}`);
    }

    notifyRemoveMember(workspaceId: string, username: string) {
        this.server.to(workspaceId).emit("remove-member", username);

    }

    notifyLeaveMember(workspaceId: string, username: string) {
        this.server.to(workspaceId).emit("leave-member", username);

    }
}