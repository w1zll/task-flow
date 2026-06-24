import {
  ConnectedSocket,
  Ack,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BoardsService } from './boards.service';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '@/auth/guards/ws-jwt.guard';
import { TasksService } from '@/tasks/tasks.service';
import { UpdateTaskDto } from '@/tasks/dto/task.dto';
import { corsOrigin } from '@/common/cors/cors-origin';

type SocketAck = (response: { ok: boolean; message?: string }) => void;

@WebSocketGateway({
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
  namespace: '/boards',
})
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly boardService: BoardsService,
    private readonly tasksService: TasksService,
  ) {}

  handleConnection(client: Socket) {
    // console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // console.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('board:join')
  async handleJoinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string },
  ) {
    const userId = (client as any).user.sub;
    const board = await this.boardService.findOne(payload.boardId, userId);
    await client.join(`board-${payload.boardId}`);
    client.emit('board:state', board);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('board:leave')
  async handleLeaveBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string },
  ) {
    await client.leave(`board-${payload.boardId}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('task:update')
  async handleTaskUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { boardId: string; taskId: string; changes: UpdateTaskDto },
    @Ack() ack?: SocketAck,
  ) {
    try {
      const userId = (client as any).user.sub;
      const updated = await this.tasksService.update(
        payload.taskId,
        payload.changes,
        userId,
      );

      this.server.to(`board-${payload.boardId}`).emit('task:update', {
        boardId: payload.boardId,
        task: updated,
      });
      ack?.({ ok: true });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to update task';
      console.error('task:update error:', message);
      client.emit('exception', { message });
      ack?.({ ok: false, message });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('task:move')
  async handleTaskMove(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      boardId: string;
      taskId: string;
      columnId: string;
      order: number;
    },
    @Ack() ack?: SocketAck,
  ) {
    try {
      const userId = (client as any).user.sub;
      const updated = await this.tasksService.move(
        payload.taskId,
        {
          columnId: payload.columnId,
          order: payload.order,
        },
        userId,
      );

      this.server.to(`board-${payload.boardId}`).emit('task:moved', {
        boardId: payload.boardId,
        task: updated,
      });
      ack?.({ ok: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to move task';
      console.error('task:move error:', message);
      client.emit('exception', { message });
      ack?.({ ok: false, message });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('task:reorder')
  async handleTaskReorder(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      boardId: string;
      columnId: string;
      taskIds: string[];
    },
    @Ack() ack?: SocketAck,
  ) {
    try {
      const userId = (client as any).user.sub;
      await this.tasksService.reorder(payload, payload.columnId, userId);

      this.server.to(`board-${payload.boardId}`).emit('task:reordered', {
        boardId: payload.boardId,
        columnId: payload.columnId,
        taskIds: payload.taskIds,
      });
      ack?.({ ok: true });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to reorder tasks';
      console.error('task:reorder error:', message);
      client.emit('exception', { message });
      ack?.({ ok: false, message });
    }
  }
}
