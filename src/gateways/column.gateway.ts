import { Logger } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
    cors: { origin: "*" }
})
export class ColumnGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(ColumnGateway.name);

    @WebSocketServer() server: Server;
    private connectedClients: Map<string, Socket> = new Map();

    afterInit() {
        this.logger.log("Board Socket Initialized")
    }

    handleConnection(client: any, ...args: any[]) {
        this.connectedClients.set(client.id, client)
    }

    handleDisconnect(client: Socket) {
        this.connectedClients.delete(client.id)
    }

    @SubscribeMessage('joinColumn')
    handleJoinColumn(client: Socket, boardId: string): void {
        client.join(boardId);
    }

    updateOrderCardIds(boardId: string) {
        this.server.to(boardId).emit("updateOrderCardIds");
    }

    notifyColumn(boardId: string) {
        this.server.to(boardId).emit("notifyBoard")
    }
}