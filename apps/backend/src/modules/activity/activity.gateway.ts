import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ActivityService } from './activity.service';

@WebSocketGateway({
  cors: { origin: process.env.APP_URL || 'http://localhost:3000', credentials: true },
  namespace: '/activity',
})
export class ActivityGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ActivityGateway.name);
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly activityService: ActivityService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit() {
    this.activityService.setGateway({
      emitToUser: (userId, event, data) => this.emitToUser(userId, event, data),
      broadcast: (event, data) => this.server.emit(event, data),
    });
    this.logger.log('Activity WebSocket gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token as string);
      const userId = payload.sub as string;
      client.data.userId = userId;
      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(client.id);
      client.join(`user:${userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
    }
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
