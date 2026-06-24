import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Column } from '@/columns/entities/column.entity';
import { Task } from '@/tasks/entities/task.entity';
import { User } from '@/users/entities/user.entity';
import {
  BoardTemplate,
  getScrumColumnTitles,
} from './board-templates';
import { BoardMember } from './entities/board-member.entity';
import { Board } from './entities/board.entity';
import { BoardsService } from './boards.service';
import { FrontendCacheService } from '@/common/frontend-cache/frontend-cache.service';

describe('BoardsService', () => {
  let service: BoardsService;
  let boardRepo: jest.Mocked<Partial<Repository<Board>>>;
  let memberRepo: jest.Mocked<Partial<Repository<BoardMember>>>;
  let columnRepo: jest.Mocked<Partial<Repository<Column>>>;
  let taskRepo: jest.Mocked<Partial<Repository<Task>>>;

  const createBoard = (overrides: Partial<Board> = {}) =>
    ({
      id: 'board-1',
      title: 'Board',
      description: null,
      color: '#6366f1',
      ownerId: 'user-1',
      columns: [],
      members: [],
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-01T00:00:00.000Z'),
      ...overrides,
    }) as Board;

  beforeEach(async () => {
    boardRepo = {
      create: jest.fn((data) => data as Board),
      findOne: jest.fn(),
      save: jest.fn(async (board: Board) =>
        createBoard({
          ...board,
          id: board.id ?? 'board-1',
        }),
      ),
    };
    memberRepo = {
      count: jest.fn(async () => 0),
      findOne: jest.fn(),
      remove: jest.fn(),
    };
    columnRepo = {
      create: jest.fn((data) => data as Column[]),
      save: jest.fn(async (columns: Column[]) =>
        columns.map(
          (column, index) =>
            ({
              ...column,
              id: `column-${index + 1}`,
              tasks: [],
            }) as Column,
        ),
      ),
    };
    taskRepo = {
      create: jest.fn((data) => data as Task[]),
      save: jest.fn(async (tasks: Task[]) => tasks),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardsService,
        {
          provide: getRepositoryToken(Board),
          useValue: boardRepo,
        },
        {
          provide: getRepositoryToken(BoardMember),
          useValue: memberRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Column),
          useValue: columnRepo,
        },
        {
          provide: getRepositoryToken(Task),
          useValue: taskRepo,
        },
        {
          provide: FrontendCacheService,
          useValue: { revalidateBoard: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<BoardsService>(BoardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates an empty board by default', async () => {
    const board = await service.create({ title: 'Empty board' }, 'user-1');

    expect(boardRepo.create).toHaveBeenCalledWith({
      title: 'Empty board',
      ownerId: 'user-1',
    });
    expect(columnRepo.save).not.toHaveBeenCalled();
    expect(board.columns).toEqual([]);
  });

  it('creates Scrum columns in order', async () => {
    const board = await service.create(
      { title: 'Scrum board', template: BoardTemplate.SCRUM },
      'user-1',
    );

    expect(columnRepo.create).toHaveBeenCalledWith(
      getScrumColumnTitles('en').map((title, order) => ({
        title,
        order,
        boardId: 'board-1',
      })),
    );
    expect(board.columns.map((column) => column.title)).toEqual(
      getScrumColumnTitles('en'),
    );
    expect(board.columns.map((column) => column.order)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('creates localized Scrum columns', async () => {
    const board = await service.create(
      { title: 'Scrum board', template: BoardTemplate.SCRUM },
      'user-1',
      'ru',
    );

    expect(board.columns.map((column) => column.title)).toEqual(
      getScrumColumnTitles('ru'),
    );
  });

  it('allows board owner access without member lookup', async () => {
    boardRepo.findOne!.mockResolvedValue(createBoard());

    await expect(
      service.ensureAccess('board-1', 'user-1'),
    ).resolves.toBeUndefined();

    expect(boardRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'board-1' },
      select: { id: true, ownerId: true },
    });
    expect(memberRepo.count).not.toHaveBeenCalled();
  });

  it('allows board member access', async () => {
    boardRepo.findOne!.mockResolvedValue(createBoard());
    memberRepo.count!.mockResolvedValue(1);

    await expect(
      service.ensureAccess('board-1', 'user-2'),
    ).resolves.toBeUndefined();

    expect(memberRepo.count).toHaveBeenCalledWith({
      where: { boardId: 'board-1', userId: 'user-2' },
    });
  });

  it('throws not found when checking access to a missing board', async () => {
    boardRepo.findOne!.mockResolvedValue(null);

    await expect(
      service.ensureAccess('missing-board', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws forbidden when user cannot access board', async () => {
    boardRepo.findOne!.mockResolvedValue(createBoard());
    memberRepo.count!.mockResolvedValue(0);

    await expect(
      service.ensureAccess('board-1', 'user-2'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('revokes a board member by membership id', async () => {
    const member = {
      id: 'membership-1',
      boardId: 'board-1',
      userId: 'user-2',
    } as BoardMember;
    boardRepo.findOne!.mockResolvedValue(createBoard());
    memberRepo.findOne!.mockResolvedValue(member);

    await service.revokeMember('board-1', 'membership-1', 'user-1');

    expect(memberRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'membership-1' },
    });
    expect(memberRepo.remove).toHaveBeenCalledWith(member);
  });

  it('does not revoke a membership belonging to another board', async () => {
    boardRepo.findOne!.mockResolvedValue(createBoard());
    memberRepo.findOne!.mockResolvedValue({
      id: 'membership-1',
      boardId: 'board-2',
      userId: 'user-2',
    } as BoardMember);

    await expect(
      service.revokeMember('board-1', 'membership-1', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(memberRepo.remove).not.toHaveBeenCalled();
  });

  it('creates a welcome board with completed tasks relative to registration', async () => {
    const registeredAt = new Date('2026-06-10T12:00:00.000Z');

    const board = await service.createWelcomeBoard('user-1', registeredAt, 'ru');
    const savedTasks = (taskRepo.save as jest.Mock).mock.calls[0][0] as Task[];
    const completedTasks = savedTasks.filter((task) => task.isCompleted);

    expect(board.title).toBe('Добро пожаловать в TaskFlow');
    expect(board.columns.map((column) => column.title)).toEqual(
      getScrumColumnTitles('ru'),
    );
    expect(savedTasks[0].title).toBe('Изучите новое рабочее пространство');
    expect(savedTasks).toHaveLength(10);
    expect(completedTasks).toHaveLength(5);
    expect(completedTasks.map((task) => task.completedAt?.toISOString())).toEqual([
      '2026-06-10T11:00:00.000Z',
      '2026-06-09T12:00:00.000Z',
      '2026-06-02T12:00:00.000Z',
      '2026-05-26T12:00:00.000Z',
      '2026-05-06T12:00:00.000Z',
    ]);
  });
});
