import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  static instance: EventsGateway | null = null;
  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly jwtService: JwtService) {
    EventsGateway.instance = this;
  }

  static emitToUser(userId: string, event: string, payload: any) {
    if (EventsGateway.instance?.server) {
      EventsGateway.instance.server.to(`user:${userId}`).emit(event, payload);
    }
  }

  static emitToProject(projectId: string, event: string, payload: any) {
    if (EventsGateway.instance?.server) {
      EventsGateway.instance.server.to(`project:${projectId}`).emit(event, payload);
    }
  }

  static emitAll(event: string, payload: any) {
    if (EventsGateway.instance?.server) {
      EventsGateway.instance.server.emit(event, payload);
    }
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token?.replace('Bearer ', '') ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        const payload = this.jwtService.decode(token) as any;
        if (payload?.sub) {
          client.data.userId = payload.sub;
          // Auto-join user to personal room
          await client.join(`user:${payload.sub}`);
          this.logger.log(`Client authenticated: ${client.id} (User: ${payload.sub})`);
          return;
        }
      }
      this.logger.log(`Client connected anonymously: ${client.id}`);
    } catch (err) {
      this.logger.warn(`Socket connection warning: ${err.message}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('user:join')
  async handleJoinUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (data?.userId) {
      await client.join(`user:${data.userId}`);
      this.logger.log(`Socket ${client.id} joined personal room: user:${data.userId}`);
      return { status: 'joined', userId: data.userId };
    }
  }

  @SubscribeMessage('project:join')
  async handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    if (data?.projectId) {
      await client.join(`project:${data.projectId}`);
      this.logger.log(`Socket ${client.id} joined room: project:${data.projectId}`);
      return { status: 'joined', projectId: data.projectId };
    }
  }

  @SubscribeMessage('project:leave')
  async handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    if (data?.projectId) {
      await client.leave(`project:${data.projectId}`);
      this.logger.log(`Socket ${client.id} left room: project:${data.projectId}`);
      return { status: 'left', projectId: data.projectId };
    }
  }

  // Broadcaster helpers
  broadcastToProject(projectId: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`project:${projectId}`).emit(event, payload);
    }
  }

  sendToUser(userId: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit(event, payload);
    }
  }
}
