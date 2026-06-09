import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Column } from '@/columns/entities/column.entity';
import { Board } from '@/boards/entities/board.entity';
import { BoardMember } from '@/boards/entities/board-member.entity';
import { User } from '@/users/entities/user.entity';
import {
  CreateTaskDto,
  MoveTaskDto,
  ReorderTasksDto,
  UpdateTaskDto,
  AnalyticsQueryDto,
} from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(Column)
    private readonly columnRepo: Repository<Column>,

    @InjectRepository(Board)
    private readonly boardRepo: Repository<Board>,

    @InjectRepository(BoardMember)
    private readonly memberRepo: Repository<BoardMember>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private async verifyColumnAccess(
    columnId: string,
    userId: string,
  ): Promise<Column> {
    const column = await this.columnRepo.findOne({
      where: { id: columnId },
      relations: ['board', 'board.members'],
    });
    if (!column) throw new NotFoundException('Колонка не найдена');

    if (
      column.board.ownerId !== userId &&
      !column.board.members?.some((member) => member.userId === userId)
    ) {
      throw new ForbiddenException('Доступ запрещен');
    }

    return column;
  }

  private async verifyTaskAccess(id: string, userId: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['column', 'column.board', 'column.board.members', 'assignee'],
    });
    if (!task) throw new NotFoundException('Задача не найдена');

    const board = task.column.board;
    if (
      board.ownerId !== userId &&
      !board.members?.some((member) => member.userId === userId)
    ) {
      throw new ForbiddenException('Доступ запрещен');
    }

    return task;
  }

  private async validateAssignee(
    boardId: string,
    assigneeId: string,
  ): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: assigneeId } });
    if (!user) throw new NotFoundException('Пользователь-назначение не найден');

    const board = await this.boardRepo.findOne({
      where: { id: boardId },
      relations: ['members'],
    });
    if (!board) throw new NotFoundException('Доска не найдена');

    if (
      board.ownerId !== assigneeId &&
      !board.members?.some((member) => member.userId === assigneeId)
    ) {
      throw new ForbiddenException(
        'Назначение возможно только участнику доски',
      );
    }

    return user;
  }

  async create(dto: CreateTaskDto, userId: string): Promise<Task> {
    const column = await this.verifyColumnAccess(dto.columnId, userId);

    if (dto.assigneeId) {
      const assignee = await this.validateAssignee(
        column.boardId,
        dto.assigneeId,
      );
      dto.assigneeName = assignee.name;
    }

    if (dto.order === undefined) {
      const count = await this.taskRepo.count({
        where: { columnId: dto.columnId },
      });
      dto.order = count;
    }

    const task = this.taskRepo.create({
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : new Date(),
      completedAt:
        dto.isCompleted && !dto.completedAt
          ? new Date()
          : dto.completedAt
            ? new Date(dto.completedAt)
            : undefined,
    });

    return this.taskRepo.save(task);
  }

  async update(id: string, dto: UpdateTaskDto, userId: string): Promise<Task> {
    const task = await this.verifyTaskAccess(id, userId);
    const { completedAt, dueDate, ...taskChanges } = dto;
    const wasCompleted = task.isCompleted;
    const sourceOrder = task.order;

    if (dto.assigneeId) {
      const assignee = await this.validateAssignee(
        task.column.boardId,
        dto.assigneeId,
      );
      task.assigneeName = assignee.name;
    }

    Object.assign(task, taskChanges);

    if (dto.isCompleted === true && !task.completedAt) {
      task.completedAt = completedAt ? new Date(completedAt) : new Date();
    }
    if (dto.isCompleted === false) {
      task.completedAt = null;
    }

    if (dto.isCompleted === true && !wasCompleted) {
      const taskCount = await this.taskRepo.count({
        where: { columnId: task.columnId },
      });
      const lastOrder = Math.max(taskCount - 1, 0);

      if (sourceOrder < lastOrder) {
        await this.taskRepo
          .createQueryBuilder()
          .update(Task)
          .set({ order: () => '"order" - 1' })
          .where(
            '"columnId" = :columnId AND "order" > :sourceOrder AND "order" <= :lastOrder',
            {
              columnId: task.columnId,
              sourceOrder,
              lastOrder,
            },
          )
          .execute();

        task.order = lastOrder;
      }
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : null;
    }

    return this.taskRepo.save(task);
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.verifyTaskAccess(id, userId);
    await this.taskRepo.remove(task);
  }

  async move(id: string, dto: MoveTaskDto, userId: string): Promise<Task> {
    const task = await this.verifyTaskAccess(id, userId);
    const sourceColumnId = task.columnId;
    const sourceOrder = task.order;

    await this.verifyColumnAccess(dto.columnId, userId);

    if (sourceColumnId === dto.columnId) {
      if (dto.order === sourceOrder) {
        return task;
      }

      if (dto.order < sourceOrder) {
        await this.taskRepo
          .createQueryBuilder()
          .update(Task)
          .set({ order: () => '"order" + 1' })
          .where(
            '"columnId" = :columnId AND "order" >= :startOrder AND "order" < :endOrder',
            {
              columnId: sourceColumnId,
              startOrder: dto.order,
              endOrder: sourceOrder,
            },
          )
          .execute();
      } else {
        await this.taskRepo
          .createQueryBuilder()
          .update(Task)
          .set({ order: () => '"order" - 1' })
          .where(
            '"columnId" = :columnId AND "order" <= :endOrder AND "order" > :startOrder',
            {
              columnId: sourceColumnId,
              startOrder: sourceOrder,
              endOrder: dto.order,
            },
          )
          .execute();
      }
    } else {
      // Shift tasks in the destination column to make space for the moved task.
      await this.taskRepo
        .createQueryBuilder()
        .update(Task)
        .set({ order: () => '"order" + 1' })
        .where('"columnId" = :columnId AND "order" >= :order', {
          columnId: dto.columnId,
          order: dto.order,
        })
        .execute();

      // Normalize source column order after removing the moved task.
      await this.taskRepo
        .createQueryBuilder()
        .update(Task)
        .set({ order: () => '"order" - 1' })
        .where('"columnId" = :columnId AND "order" > :order', {
          columnId: sourceColumnId,
          order: sourceOrder,
        })
        .execute();
    }

    await this.taskRepo.update(
      { id: task.id },
      { columnId: dto.columnId, order: dto.order },
    );

    return this.taskRepo.findOne({
      where: { id: task.id },
      relations: ['column', 'column.board', 'assignee'],
    });
  }

  async reorder(
    dto: ReorderTasksDto,
    columnId: string,
    userId: string,
  ): Promise<void> {
    await this.verifyColumnAccess(columnId, userId);
    const updates = dto.taskIds.map((taskId, index) =>
      this.taskRepo.update({ id: taskId, columnId }, { order: index }),
    );
    await Promise.all(updates);
  }

  private buildCompletionAnalyticsQuery(
    userId: string,
    query: AnalyticsQueryDto,
  ): SelectQueryBuilder<Task> {
    const qb = this.taskRepo
      .createQueryBuilder('task')
      .innerJoin('task.column', 'column')
      .innerJoin('column.board', 'board')
      .leftJoin('board.members', 'member', 'member.userId = :userId', {
        userId,
      })
      .where('task.isCompleted = true')
      .andWhere('task.completedAt IS NOT NULL')
      .andWhere('(board.ownerId = :userId OR member.userId = :userId)', {
        userId,
      });

    if (query.boardId) {
      qb.andWhere('board.id = :boardId', { boardId: query.boardId });
    }
    if (query.fromDate) {
      qb.andWhere('task.completedAt >= :fromDate', {
        fromDate: new Date(query.fromDate),
      });
    }
    if (query.toDate) {
      qb.andWhere('task.completedAt <= :toDate', {
        toDate: new Date(query.toDate),
      });
    }

    return qb;
  }

  async getDailyAnalytics(
    userId: string,
    query: AnalyticsQueryDto,
  ): Promise<{ period: string; count: number }[]> {
    const qb = this.buildCompletionAnalyticsQuery(userId, query);

    const raw = await qb
      .select(
        "TO_CHAR(DATE_TRUNC('day', task.completedAt), 'YYYY-MM-DD')",
        'period',
      )
      .addSelect('COUNT(*)', 'count')
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    return raw.map((item) => ({
      period: item.period,
      count: Number(item.count) || 0,
    }));
  }

  async getWeeklyAnalytics(
    userId: string,
    query: AnalyticsQueryDto,
  ): Promise<{ period: string; count: number }[]> {
    const qb = this.buildCompletionAnalyticsQuery(userId, query);

    const raw = await qb
      .select(
        "TO_CHAR(DATE_TRUNC('week', task.completedAt), 'YYYY-MM-DD')",
        'period',
      )
      .addSelect('COUNT(*)', 'count')
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    return raw.map((item) => ({
      period: item.period,
      count: Number(item.count) || 0,
    }));
  }

  async getMonthlyAnalytics(
    userId: string,
    query: AnalyticsQueryDto,
  ): Promise<{ period: string; count: number }[]> {
    const qb = this.buildCompletionAnalyticsQuery(userId, query);

    const raw = await qb
      .select(
        "TO_CHAR(DATE_TRUNC('month', task.completedAt), 'YYYY-MM')",
        'period',
      )
      .addSelect('COUNT(*)', 'count')
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    return raw.map((item) => ({
      period: item.period,
      count: Number(item.count) || 0,
    }));
  }

  async getCompletionSummary(
    userId: string,
    query: AnalyticsQueryDto,
  ): Promise<{ total: number; onTime: number; late: number }> {
    const qb = this.buildCompletionAnalyticsQuery(userId, query);

    const summary = await qb
      .select('COUNT(*)', 'total')
      .addSelect(
        'SUM(CASE WHEN task.dueDate IS NULL OR task.completedAt <= task.dueDate THEN 1 ELSE 0 END)',
        'onTime',
      )
      .addSelect(
        'SUM(CASE WHEN task.dueDate IS NOT NULL AND task.completedAt > task.dueDate THEN 1 ELSE 0 END)',
        'late',
      )
      .getRawOne();

    return {
      total: Number(summary.total) || 0,
      onTime: Number(summary.onTime) || 0,
      late: Number(summary.late) || 0,
    };
  }
}
