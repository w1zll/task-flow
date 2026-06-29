import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BoardPermissionsService } from '@/boards/board-permissions.service';
import { Board } from '@/boards/entities/board.entity';
import { Column } from '@/columns/entities/column.entity';
import { FrontendCacheService } from '@/common/frontend-cache/frontend-cache.service';
import { User } from '@/users/entities/user.entity';
import { toPublicUser } from '@/users/public-user';
import {
  AnalyticsQueryDto,
  CreateTaskDto,
  MoveTaskDto,
  ReorderTasksDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { Task, TaskPriority } from './entities/task.entity';
import { WorkspacesService } from '@/workspaces/workspaces.service';
import { Team } from '@/teams/entities/team.entity';
import { BoardActivityEventsService } from '@/boards/board-activity-events.service';

type ActivityChange = {
  field: string;
  from: unknown;
  to: unknown;
};

type TaskActivitySnapshot = {
  title: string;
  description: string | null;
  priority: TaskPriority;
  labels: string[];
  dueDate: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  teamId: string | null;
  teamName: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  columnId: string;
  columnTitle: string | null;
};

const hasOwn = (value: object, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

const toIsoStringOrNull = (value: Date | string | null | undefined) =>
  value ? new Date(value).toISOString() : null;

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Column)
    private readonly columnRepo: Repository<Column>,
    @InjectRepository(Board)
    private readonly boardRepo: Repository<Board>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    private readonly frontendCache: FrontendCacheService,
    private readonly boardPermissions: BoardPermissionsService,
    private readonly workspacesService: WorkspacesService,
    private readonly boardActivityEvents: BoardActivityEventsService,
  ) {}

  private async verifyColumnWriteAccess(
    columnId: string,
    userId: string,
  ): Promise<Column> {
    const column = await this.columnRepo.findOne({ where: { id: columnId } });
    if (!column) throw new NotFoundException('Column not found');

    await this.boardPermissions.assertCanEditBoardContent(
      column.boardId,
      userId,
    );
    return column;
  }

  private async verifyTaskWriteAccess(
    id: string,
    userId: string,
  ): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['column', 'column.board', 'assignee', 'team'],
    });
    if (!task) throw new NotFoundException('Task not found');

    await this.boardPermissions.assertCanEditBoardContent(
      task.column.boardId,
      userId,
    );
    return task;
  }

  private async validateAssignee(
    boardId: string,
    assigneeId: string,
  ): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: assigneeId } });
    if (!user) throw new NotFoundException('Assignee not found');

    const board = await this.boardRepo.findOne({
      where: { id: boardId },
      relations: ['members'],
    });
    if (!board) throw new NotFoundException('Board not found');
    try {
      await this.workspacesService.assertMember(
        board.workspaceId,
        assigneeId,
      );
    } catch {
      throw new ForbiddenException(
        'Assignee must belong to the board workspace',
      );
    }
    if (
      board.ownerId !== assigneeId &&
      !board.members?.some((member) => member.userId === assigneeId)
    ) {
      throw new ForbiddenException(
        'Tasks can only be assigned to board members',
      );
    }

    return user;
  }

  private async validateTeam(
    boardId: string,
    teamId: string,
  ): Promise<Team> {
    const board = await this.boardRepo.findOne({
      where: { id: boardId },
      select: { id: true, workspaceId: true },
    });
    if (!board) throw new NotFoundException('Board not found');

    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    if (team.workspaceId !== board.workspaceId) {
      throw new ForbiddenException(
        'Task team must belong to the board workspace',
      );
    }
    return team;
  }

  async create(dto: CreateTaskDto, userId: string): Promise<Task> {
    const column = await this.verifyColumnWriteAccess(dto.columnId, userId);
    let assignee: User | undefined;
    let team: Team | undefined;

    if (dto.assigneeId) {
      assignee = await this.validateAssignee(column.boardId, dto.assigneeId);
      dto.assigneeName = assignee.name;
    }
    if (dto.teamId) {
      team = await this.validateTeam(column.boardId, dto.teamId);
    }
    if (dto.order === undefined) {
      dto.order = await this.taskRepo.count({
        where: { columnId: dto.columnId },
      });
    }

    const task = this.taskRepo.create({
      ...dto,
      assignee,
      team,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      completedAt:
        dto.isCompleted && !dto.completedAt
          ? new Date()
          : dto.completedAt
            ? new Date(dto.completedAt)
            : undefined,
    });
    const saved = await this.taskRepo.save(task);
    await this.frontendCache.revalidateBoard(column.boardId);
    await this.boardActivityEvents.logTaskCreated(column.boardId, userId, {
      taskId: saved.id,
      title: saved.title,
      columnId: saved.columnId,
      columnTitle: column.title,
      assigneeId: saved.assignee?.id ?? saved.assigneeId ?? null,
      assigneeName: saved.assignee?.name ?? saved.assigneeName ?? null,
      teamId: saved.team?.id ?? saved.teamId ?? null,
      teamName: saved.team?.name ?? null,
    });
    return this.withPublicAssignee(saved);
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    userId: string,
    expectedBoardId?: string,
  ): Promise<Task> {
    const task = await this.verifyTaskWriteAccess(id, userId);
    this.assertExpectedBoard(task.column.boardId, expectedBoardId);
    const beforeActivity = this.snapshotTaskActivity(task);
    const { completedAt, dueDate, teamId, ...taskChanges } = dto;
    const wasCompleted = task.isCompleted;
    const sourceOrder = task.order;

    if (dto.assigneeId) {
      const assignee = await this.validateAssignee(
        task.column.boardId,
        dto.assigneeId,
      );
      task.assigneeName = assignee.name;
      task.assignee = assignee;
    }
    if (teamId !== undefined) {
      if (teamId === null) {
        task.teamId = null;
        task.team = null;
      } else {
        const team = await this.validateTeam(task.column.boardId, teamId);
        task.teamId = team.id;
        task.team = team;
      }
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

    const saved = await this.taskRepo.save(task);
    await this.frontendCache.revalidateBoard(task.column.boardId);
    const changes = this.buildTaskActivityChanges(
      beforeActivity,
      this.snapshotTaskActivity(saved),
      dto,
    );

    if (changes.length) {
      const activityPayload = {
        taskId: saved.id,
        title: saved.title,
        columnId: saved.columnId,
        columnTitle: saved.column?.title ?? beforeActivity.columnTitle,
        changes,
      };

      if (!beforeActivity.isCompleted && saved.isCompleted) {
        await this.boardActivityEvents.logTaskCompleted(
          task.column.boardId,
          userId,
          activityPayload,
        );
      } else {
        await this.boardActivityEvents.logTaskUpdated(
          task.column.boardId,
          userId,
          activityPayload,
        );
      }
    }
    return this.withPublicAssignee(saved);
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.verifyTaskWriteAccess(id, userId);
    const boardId = task.column.boardId;
    await this.taskRepo.remove(task);
    await this.frontendCache.revalidateBoard(boardId);
    await this.boardActivityEvents.logTaskDeleted(boardId, userId, {
      taskId: task.id,
      title: task.title,
      columnId: task.columnId,
      columnTitle: task.column?.title ?? null,
    });
  }

  async move(
    id: string,
    dto: MoveTaskDto,
    userId: string,
    expectedBoardId?: string,
  ): Promise<Task> {
    const task = await this.verifyTaskWriteAccess(id, userId);
    this.assertExpectedBoard(task.column.boardId, expectedBoardId);
    const sourceColumnId = task.columnId;
    const sourceOrder = task.order;
    const targetColumn = await this.verifyColumnWriteAccess(
      dto.columnId,
      userId,
    );
    if (targetColumn.boardId !== task.column.boardId) {
      throw new BadRequestException(
        'A task cannot be moved to another board',
      );
    }

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
      await this.taskRepo
        .createQueryBuilder()
        .update(Task)
        .set({ order: () => '"order" + 1' })
        .where('"columnId" = :columnId AND "order" >= :order', {
          columnId: dto.columnId,
          order: dto.order,
        })
        .execute();
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
    const updated = await this.taskRepo.findOne({
      where: { id: task.id },
      relations: ['column', 'column.board', 'assignee', 'team'],
    });
    await this.frontendCache.revalidateBoard(updated.column.boardId);
    await this.boardActivityEvents.logTaskMoved(updated.column.boardId, userId, {
      taskId: updated.id,
      title: updated.title,
      fromColumnId: sourceColumnId,
      fromColumnTitle: task.column?.title ?? null,
      toColumnId: dto.columnId,
      toColumnTitle: targetColumn.title,
      order: dto.order,
    });
    return this.withPublicAssignee(updated);
  }

  async reorder(
    dto: ReorderTasksDto,
    columnId: string,
    userId: string,
    expectedBoardId?: string,
  ): Promise<string> {
    const column = await this.verifyColumnWriteAccess(columnId, userId);
    this.assertExpectedBoard(column.boardId, expectedBoardId);
    const updates = dto.taskIds.map((taskId, index) =>
      this.taskRepo.update({ id: taskId, columnId }, { order: index }),
    );
    await Promise.all(updates);
    await this.frontendCache.revalidateBoard(column.boardId);
    await this.boardActivityEvents.logTaskReordered(column.boardId, userId, {
      columnId: column.id,
      columnTitle: column.title,
      taskIds: dto.taskIds,
    });
    return column.boardId;
  }

  private snapshotTaskActivity(task: Task): TaskActivitySnapshot {
    return {
      title: task.title,
      description: task.description ?? null,
      priority: task.priority,
      labels: task.labels ?? [],
      dueDate: toIsoStringOrNull(task.dueDate),
      assigneeId: task.assignee?.id ?? task.assigneeId ?? null,
      assigneeName: task.assignee?.name ?? task.assigneeName ?? null,
      teamId: task.team?.id ?? task.teamId ?? null,
      teamName: task.team?.name ?? null,
      isCompleted: task.isCompleted,
      completedAt: toIsoStringOrNull(task.completedAt),
      columnId: task.columnId,
      columnTitle: task.column?.title ?? null,
    };
  }

  private buildTaskActivityChanges(
    before: TaskActivitySnapshot,
    after: TaskActivitySnapshot,
    dto: UpdateTaskDto,
  ): ActivityChange[] {
    const changes: ActivityChange[] = [];

    if (hasOwn(dto, 'title')) {
      this.addActivityChange(changes, 'title', before.title, after.title);
    }
    if (hasOwn(dto, 'description')) {
      this.addActivityChange(
        changes,
        'description',
        before.description,
        after.description,
      );
    }
    if (hasOwn(dto, 'priority')) {
      this.addActivityChange(
        changes,
        'priority',
        before.priority,
        after.priority,
      );
    }
    if (hasOwn(dto, 'labels')) {
      this.addActivityChange(changes, 'labels', before.labels, after.labels);
    }
    if (hasOwn(dto, 'dueDate')) {
      this.addActivityChange(changes, 'dueDate', before.dueDate, after.dueDate);
    }
    if (hasOwn(dto, 'assigneeId')) {
      this.addActivityChange(
        changes,
        'assignee',
        { id: before.assigneeId, name: before.assigneeName },
        { id: after.assigneeId, name: after.assigneeName },
      );
    }
    if (hasOwn(dto, 'teamId')) {
      this.addActivityChange(
        changes,
        'team',
        { id: before.teamId, name: before.teamName },
        { id: after.teamId, name: after.teamName },
      );
    }
    if (hasOwn(dto, 'isCompleted')) {
      this.addActivityChange(
        changes,
        'isCompleted',
        before.isCompleted,
        after.isCompleted,
      );
    }
    if (hasOwn(dto, 'completedAt')) {
      this.addActivityChange(
        changes,
        'completedAt',
        before.completedAt,
        after.completedAt,
      );
    }

    return changes;
  }

  private addActivityChange(
    changes: ActivityChange[],
    field: string,
    from: unknown,
    to: unknown,
  ) {
    if (JSON.stringify(from) === JSON.stringify(to)) return;
    changes.push({ field, from, to });
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

  private withPublicAssignee(task: Task): Task {
    if (task?.assignee) {
      task.assignee = toPublicUser(task.assignee);
    }
    return task;
  }

  private assertExpectedBoard(
    actualBoardId: string,
    expectedBoardId?: string,
  ): void {
    if (expectedBoardId && actualBoardId !== expectedBoardId) {
      throw new BadRequestException('Resource does not belong to this board');
    }
  }

  async getDailyAnalytics(
    userId: string,
    query: AnalyticsQueryDto,
  ): Promise<{ period: string; count: number }[]> {
    const raw = await this.buildCompletionAnalyticsQuery(userId, query)
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
    const raw = await this.buildCompletionAnalyticsQuery(userId, query)
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
    const raw = await this.buildCompletionAnalyticsQuery(userId, query)
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
    const summary = await this.buildCompletionAnalyticsQuery(userId, query)
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
