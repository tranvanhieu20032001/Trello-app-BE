import { Logger } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(BoardGateway.name);

    @WebSocketServer() server: Server;
    private connectedClients: Map<string, Socket> = new Map();

    afterInit() {
        this.logger.log("Board Socket Initialized")
    }

    handleConnection(client: Socket, ...args: any[]) {
        this.connectedClients.set(client.id, client);
        console.log(`Client connected:${client.id}`);
    }
    handleDisconnect(client: Socket) {
        this.connectedClients.delete(client.id)
        console.log(`Client disconnected: ${client.id}`);

    }

    @SubscribeMessage('joinBoard')
    handleJoinBoard(client: Socket, boardId: string): void {
        client.join(boardId);
    }

    
    notifyBoard(boardId: string) {
        this.server.to(boardId).emit("notify");
    }

    notifyNewMember(boardId: string, username: string) {
        this.server.to(boardId).emit('new-member', username);
    }

    notifyRemoveMember(boardId: string, username: string) {
        this.server.to(boardId).emit("remove-member", username);

    }

    notifyLeaveMember(boardId: string, username: string) {
        this.server.to(boardId).emit("leave-member", username);

    }

    updateColumnOrder(boardId: string) {
        this.server.to(boardId).emit("updateColumnOrder");
    }
}