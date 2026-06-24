import { ForbiddenException } from '@nestjs/common';
import { Socket } from 'socket.io';
import { TasksService } from '@/tasks/tasks.service';
import { BoardGateway } from './boards.gateway';
import { BoardsService } from './boards.service';

describe('BoardGateway', () => {
  let gateway: BoardGateway;
  let boardsService: jest.Mocked<Pick<BoardsService, 'findOne'>>;
  let tasksService: jest.Mocked<
    Pick<TasksService, 'update' | 'move' | 'reorder'>
  >;
  let roomEmit: jest.Mock;
  let serverTo: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;
  let client: jest.Mocked<Pick<Socket, 'join' | 'leave' | 'emit'>> & {
    user: { sub: string };
  };

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    boardsService = {
      findOne: jest.fn(),
    };
    tasksService = {
      update: jest.fn(),
      move: jest.fn(),
      reorder: jest.fn(),
    };
    gateway = new BoardGateway(
      boardsService as unknown as BoardsService,
      tasksService as unknown as TasksService,
    );
    roomEmit = jest.fn();
    serverTo = jest.fn(() => ({ emit: roomEmit }));
    gateway.server = { to: serverTo } as never;
    client = {
      user: { sub: 'user-1' },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
    };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('checks access before joining a board room', async () => {
    const board = { id: 'board-1' };
    boardsService.findOne.mockResolvedValue(board as never);

    await gateway.handleJoinBoard(client as unknown as Socket, {
      boardId: 'board-1',
    });

    expect(boardsService.findOne).toHaveBeenCalledWith('board-1', 'user-1');
    expect(client.join).toHaveBeenCalledWith('board-board-1');
    expect(client.emit).toHaveBeenCalledWith('board:state', board);
    expect(boardsService.findOne.mock.invocationCallOrder[0]).toBeLessThan(
      client.join.mock.invocationCallOrder[0],
    );
  });

  it('does not join a forbidden board room', async () => {
    boardsService.findOne.mockRejectedValue(
      new ForbiddenException('Access denied'),
    );

    await expect(
      gateway.handleJoinBoard(client as unknown as Socket, {
        boardId: 'board-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(client.join).not.toHaveBeenCalled();
    expect(client.emit).not.toHaveBeenCalledWith(
      'board:state',
      expect.anything(),
    );
  });

  it('leaves the requested board room', async () => {
    await gateway.handleLeaveBoard(client as unknown as Socket, {
      boardId: 'board-1',
    });

    expect(client.leave).toHaveBeenCalledWith('board-board-1');
  });

  it('does not broadcast a viewer task update rejected by permissions', async () => {
    tasksService.update.mockRejectedValue(
      new ForbiddenException('You do not have permission to edit this board'),
    );
    const ack = jest.fn();

    await gateway.handleTaskUpdate(
      client as unknown as Socket,
      {
        boardId: 'board-1',
        taskId: 'task-1',
        changes: { title: 'Blocked' },
      },
      ack,
    );

    expect(tasksService.update).toHaveBeenCalledWith(
      'task-1',
      { title: 'Blocked' },
      'user-1',
      'board-1',
    );
    expect(serverTo).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalledWith({
      ok: false,
      message: 'You do not have permission to edit this board',
    });
  });

  it('broadcasts a task update only to its actual board room', async () => {
    const task = {
      id: 'task-1',
      column: { boardId: 'board-1' },
    };
    tasksService.update.mockResolvedValue(task as never);
    const ack = jest.fn();

    await gateway.handleTaskUpdate(
      client as unknown as Socket,
      {
        boardId: 'board-1',
        taskId: 'task-1',
        changes: { title: 'Updated' },
      },
      ack,
    );

    expect(serverTo).toHaveBeenCalledWith('board-board-1');
    expect(roomEmit).toHaveBeenCalledWith('task:update', {
      boardId: 'board-1',
      task,
    });
    expect(ack).toHaveBeenCalledWith({ ok: true });
  });
});
