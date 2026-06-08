import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Board } from '@/boards/entities/board.entity';
import { BoardMember } from '@/boards/entities/board-member.entity';
import { Column } from '@/columns/entities/column.entity';
import { User } from '@/users/entities/user.entity';
import { Task, TaskPriority } from './entities/task.entity';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepo: jest.Mocked<Partial<Repository<Task>>>;

  const userId = 'user-1';

  const createTask = (overrides: Partial<Task> = {}): Task =>
    ({
      id: 'task-1',
      title: 'Task',
      description: null,
      priority: TaskPriority.MEDIUM,
      order: 0,
      labels: [],
      dueDate: null,
      assigneeName: null,
      assigneeId: null,
      assignee: null,
      isCompleted: false,
      completedAt: null,
      columnId: 'column-1',
      column: {
        id: 'column-1',
        boardId: 'board-1',
        board: {
          id: 'board-1',
          ownerId: userId,
          members: [],
        },
      },
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-01T00:00:00.000Z'),
      ...overrides,
    }) as Task;

  beforeEach(async () => {
    taskRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (task: Task) => task),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: taskRepo,
        },
        {
          provide: getRepositoryToken(Column),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Board),
          useValue: {},
        },
        {
          provide: getRepositoryToken(BoardMember),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('sets completedAt when completing a task without a timestamp', async () => {
    const now = new Date('2026-06-08T10:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);
    taskRepo.findOne.mockResolvedValue(createTask());

    const result = await service.update('task-1', { isCompleted: true }, userId);

    expect(result.isCompleted).toBe(true);
    expect(result.completedAt).toEqual(now);
    expect(taskRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        isCompleted: true,
        completedAt: now,
      }),
    );
  });

  it('clears completedAt when un-completing a task', async () => {
    taskRepo.findOne.mockResolvedValue(
      createTask({
        isCompleted: true,
        completedAt: new Date('2026-06-07T10:00:00.000Z'),
      }),
    );

    const result = await service.update(
      'task-1',
      { isCompleted: false },
      userId,
    );

    expect(result.isCompleted).toBe(false);
    expect(result.completedAt).toBeNull();
    expect(taskRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        isCompleted: false,
        completedAt: null,
      }),
    );
  });

  it('preserves completedAt during unrelated task updates', async () => {
    const completedAt = new Date('2026-06-07T10:00:00.000Z');
    taskRepo.findOne.mockResolvedValue(
      createTask({
        isCompleted: true,
        completedAt,
      }),
    );

    const result = await service.update(
      'task-1',
      { title: 'Renamed task' },
      userId,
    );

    expect(result.title).toBe('Renamed task');
    expect(result.isCompleted).toBe(true);
    expect(result.completedAt).toBe(completedAt);
    expect(taskRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Renamed task',
        completedAt,
      }),
    );
  });

  it('keeps the original completedAt when completing an already completed task', async () => {
    const completedAt = new Date('2026-06-07T10:00:00.000Z');
    taskRepo.findOne.mockResolvedValue(
      createTask({
        isCompleted: true,
        completedAt,
      }),
    );

    const result = await service.update('task-1', { isCompleted: true }, userId);

    expect(result.isCompleted).toBe(true);
    expect(result.completedAt).toBe(completedAt);
  });
});
