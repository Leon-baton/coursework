import { JwtService } from '@nestjs/jwt';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { DocumentService } from './document.service';

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class DocumentGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedClients: Map<string, { userId: number; username: string; documentId: number }> = new Map();
    private documentRooms: Map<number, Set<string>> = new Map();
    private savingDocuments: Set<number> = new Set();

    constructor(
        private readonly documentService: DocumentService,
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
    ) {}

    afterInit(server: Server) {
        console.log('WebSocket Gateway initialized');
    }

    async handleConnection(client: Socket) {
        const token = client.handshake.auth.token;
        console.log(`Attempting to connect client: ${client.id}`);

        if (!token) {
            console.log('No token provided, disconnecting socket');
            client.disconnect();
            return;
        }

        try {
            const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_ACCESS_SECRET,
            });
            const user = await this.userService.getUserById(payload.id);
            this.connectedClients.set(client.id, { userId: user.id, username: user.username, documentId: null });
            const clientInfo = this.connectedClients.get(client.id);
            client.emit('authenticated');
            console.log(`Client connected: ${client.id}, User: ${clientInfo?.username}`);
        } catch (error) {
            console.error('WebSocket authentication failed:', error.message);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        const clientInfo = this.connectedClients.get(client.id);
        if (clientInfo && clientInfo.documentId) {
            const documentRoom = this.documentRooms.get(clientInfo.documentId);
            if (documentRoom) {
                documentRoom.delete(client.id);
                if (documentRoom.size === 0) {
                    this.documentRooms.delete(clientInfo.documentId);
                }
                this.emitParticipantsList(clientInfo.documentId);
            }
        }
        this.connectedClients.delete(client.id);
    }

    @SubscribeMessage('joinDocument')
    async handleJoinDocument(@ConnectedSocket() client: Socket, @MessageBody('documentId') documentId: number) {
        const clientInfo = this.connectedClients.get(client.id);
        if (!clientInfo) {
            client.emit('error', 'Authentication required.');
            client.disconnect();
            return;
        }
        try {
            const document = await this.documentService.getDocumentById(documentId);
            client.join(`document-${documentId}`);
            clientInfo.documentId = documentId;

            if (!this.documentRooms.has(documentId)) {
                this.documentRooms.set(documentId, new Set());
            }
            this.documentRooms.get(documentId).add(client.id);

            client.emit('documentContent', {
                documentId: document.id,
                content: document.content,
                lastSaved: document.updatedAt || document.createdAt,
                isSaving: this.savingDocuments.has(documentId),
            });

            console.log(`User ${clientInfo.username} joined document-${documentId}`);
            this.emitParticipantsList(documentId);
        } catch (error) {
            console.error(`Failed to join document ${documentId}:`, error.message);
            client.emit('error', `Failed to join document: ${error.message}`);
        }
    }

    @SubscribeMessage('startSaving')
    handleStartSaving(@ConnectedSocket() client: Socket, @MessageBody('documentId') documentId: number) {
        const clientInfo = this.connectedClients.get(client.id);
        if (!clientInfo || clientInfo.documentId !== documentId) return;

        this.savingDocuments.add(documentId);
        this.server.to(`document-${documentId}`).emit('documentSavingState', { documentId, isSaving: true });
        console.log(`Document ${documentId} is now being saved by someone.`);
    }

    @SubscribeMessage('endSaving')
    handleEndSaving(@ConnectedSocket() client: Socket, @MessageBody() data: { documentId: number; lastSaved: string }) {
        const clientInfo = this.connectedClients.get(client.id);
        if (!clientInfo || clientInfo.documentId !== data.documentId) return;

        this.savingDocuments.delete(data.documentId);
        this.server.to(`document-${data.documentId}`).emit('documentSavingState', {
            documentId: data.documentId,
            isSaving: false,
            lastSaved: data.lastSaved,
        });
        console.log(`Document ${data.documentId} saving completed.`);
    }

    @SubscribeMessage('sendDocumentUpdate')
    handleDocumentContentUpdate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { documentId: number; content: string },
    ) {
        const clientInfo = this.connectedClients.get(client.id);
        if (!clientInfo || clientInfo.documentId !== data.documentId) {
            return;
        }

        client.to(`document-${data.documentId}`).emit('documentUpdate', {
            documentId: data.documentId,
            content: data.content,
        });
    }

    @SubscribeMessage('leaveDocument')
    handleLeaveDocument(@ConnectedSocket() client: Socket, @MessageBody('documentId') documentId: number) {
        const clientInfo = this.connectedClients.get(client.id);
        if (clientInfo && clientInfo.documentId === documentId) {
            client.leave(`document-${documentId}`);
            const documentRoom = this.documentRooms.get(documentId);
            if (documentRoom) {
                documentRoom.delete(client.id);
                if (documentRoom.size === 0) {
                    this.documentRooms.delete(documentId);
                }
                this.emitParticipantsList(documentId);
            }
            clientInfo.documentId = null;
            console.log(`User ${clientInfo.username} left document-${documentId}`);
        }
    }

    private emitParticipantsList(documentId: number) {
        const roomSockets = this.documentRooms.get(documentId);
        if (roomSockets) {
            const participants = Array.from(roomSockets)
                .map((socketId) => this.connectedClients.get(socketId))
                .filter((info) => info && info.documentId === documentId)
                .map((info) => ({ userId: info.userId, username: info.username }));
            this.server.to(`document-${documentId}`).emit('participantsUpdate', participants);
            console.log(`Participants for document-${documentId}:`, participants);
        }
    }
}
