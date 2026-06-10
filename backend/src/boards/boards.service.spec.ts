import { getRepositoryToken } from '@nestjs/typeorm';
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
      save: jest.fn(async (board: Board) =>
        createBoard({
          ...board,
          id: board.id ?? 'board-1',
        }),
      ),
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
          useValue: {},
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
