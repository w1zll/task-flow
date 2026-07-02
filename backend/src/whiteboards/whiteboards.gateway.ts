import { WsJwtGuard } from '@/auth/guards/ws-jwt.guard';
import { corsOrigin } from '@/common/cors/cors-origin';
import { HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import {
  Ack,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateWhiteboardOperationDto } from './dto/whiteboard.dto';
import { WhiteboardOperation } from './entities/whiteboard-operation.entity';
import { WhiteboardsService } from './whiteboards.service';

type WhiteboardAckResponse = {
  ok: boolean;
  code?: 'permission_changed' | 'whiteboard_deleted' | 'validation_failed' | 'unknown';
  message?: string;
  retryable?: boolean;
  operation?: WhiteboardOperation;
};

type WhiteboardAck = (response: WhiteboardAckResponse) => void;

const roomName = (whiteboardId: string) => `whiteboard-${whiteboardId}`;

@WebSocketGateway({
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
  namespace: '/whiteboards',
})
export class WhiteboardsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly whiteboardsService: WhiteboardsService) {}

  handleConnection(client: Socket) {
    // Auth is handled by message guards so sockets can connect before token refresh.
  }

  handleDisconnect(client: Socket) {
    // Presence is emitted opportunistically by cursor events.
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('whiteboard:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { whiteboardId: string },
  ) {
    const userId = (client as any).user.sub;
    const whiteboard = await this.whiteboardsService.assertCanReadById(
      payload.whiteboardId,
      userId,
    );
    await client.join(roomName(payload.whiteboardId));
    client.emit('whiteboard:joined', {
      whiteboardId: payload.whiteboardId,
      workspaceId: whiteboard.workspaceId,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('whiteboard:leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { whiteboardId: string },
  ) {
    await client.leave(roomName(payload.whiteboardId));
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('whiteboard:operation')
  async handleOperation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: CreateWhiteboardOperationDto & { whiteboardId: string },
    @Ack() ack?: WhiteboardAck,
  ) {
    const userId = (client as any).user.sub;
    try {
      const operation = await this.whiteboardsService.appendOperation(
        payload.whiteboardId,
        payload,
        userId,
      );
      this.server.to(roomName(payload.whiteboardId)).emit('whiteboard:operation', {
        whiteboardId: payload.whiteboardId,
        operation,
      });
      ack?.({ ok: true, operation });
    } catch (error) {
      this.handleError(client, ack, error, 'Failed to apply whiteboard operation');
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('whiteboard:clear')
  async handleClear(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { whiteboardId: string; idempotencyKey: string },
    @Ack() ack?: WhiteboardAck,
  ) {
    const userId = (client as any).user.sub;
    try {
      const operation = await this.whiteboardsService.clear(
        payload.whiteboardId,
        payload.idempotencyKey,
        userId,
      );
      this.server.to(roomName(payload.whiteboardId)).emit('whiteboard:operation', {
        whiteboardId: payload.whiteboardId,
        operation,
      });
      ack?.({ ok: true, operation });
    } catch (error) {
      this.handleError(client, ack, error, 'Failed to clear whiteboard');
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('whiteboard:cursor')
  async handleCursor(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      whiteboardId: string;
      x: number;
      y: number;
      color?: string;
      tool?: string;
      userName?: string;
    },
  ) {
    const userId = (client as any).user.sub;
    await this.whiteboardsService.assertCanReadById(
      payload.whiteboardId,
      userId,
    );
    client.to(roomName(payload.whiteboardId)).emit('whiteboard:cursor', {
      ...payload,
      userId,
    });
  }

  private handleError(
    client: Socket,
    ack: WhiteboardAck | undefined,
    error: unknown,
    fallbackMessage: string,
  ) {
    const response = this.createAckError(error, fallbackMessage);
    client.emit('exception', {
      message: response.message,
      code: response.code,
    });
    ack?.(response);
  }

  private createAckError(
    error: unknown,
    fallbackMessage: string,
  ): WhiteboardAckResponse {
    const message =
      error instanceof Error && error.message ? error.message : fallbackMessage;
    const status =
      error instanceof HttpException ? error.getStatus() : undefined;

    if (status === HttpStatus.FORBIDDEN) {
      return {
        ok: false,
        code: 'permission_changed',
        message,
        retryable: false,
      };
    }
    if (status === HttpStatus.NOT_FOUND) {
      return {
        ok: false,
        code: 'whiteboard_deleted',
        message,
        retryable: false,
      };
    }
    if (status === HttpStatus.BAD_REQUEST) {
      return {
        ok: false,
        code: 'validation_failed',
        message,
        retryable: false,
      };
    }

    return {
      ok: false,
      code: 'unknown',
      message,
      retryable: true,
    };
  }
}
