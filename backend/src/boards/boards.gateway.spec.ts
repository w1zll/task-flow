import { ForbiddenException } from '@nestjs/common';
import { Socket } from 'socket.io';
import { TasksService } from '@/tasks/tasks.service';
import { BoardGateway } from './boards.gateway';
import { BoardsService } from './boards.service';

describe('BoardGateway', () => {
  let gateway: BoardGateway;
  let boardsService: jest.Mocked<Pick<BoardsService, 'findOne'>>;
  let client: jest.Mocked<Pick<Socket, 'join' | 'leave' | 'emit'>> & {
    user: { sub: string };
  };

  beforeEach(() => {
    boardsService = {
      findOne: jest.fn(),
    };
    gateway = new BoardGateway(
      boardsService as unknown as BoardsService,
      {} as TasksService,
    );
    client = {
      user: { sub: 'user-1' },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
    };
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
});
