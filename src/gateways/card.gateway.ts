import { Logger } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class CardGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(CardGateway.name)

    @WebSocketServer() server: Server;
    private connectedClients: Map<string, Socket> = new Map()

    afterInit() {
        this.logger.log("Card Socket Initialized")
    }

    handleConnection(client: Socket, ...args: any[]) {
        this.connectedClients.set(client.id, client);
    }

    handleDisconnect(client: Socket) {
        this.connectedClients.delete(client.id)
    }

    @SubscribeMessage('joinCard')
    handleJoinBoard(client: Socket, cardId: string): void {
        client.join(cardId);
    }

    notifyCard(cardId: string) { 
        this.server.to(cardId).emit('notify');
    }
}