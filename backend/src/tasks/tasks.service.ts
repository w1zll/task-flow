import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';
import { Column } from '@/columns/entities/column.entity';
import { Board } from '@/boards/entities/board.entity';
import {
  CreateTaskDto,
  MoveTaskDto,
  ReorderTasksDto,
  UpdateTaskDto,
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
  ) {}

  private async verifyColumnOwner(
    columnId: string,
    userId: string,
  ): Promise<Column> {
    const column = await this.columnRepo.findOne({ where: { id: columnId } });
    if (!column) throw new NotFoundException('Колонка не найдена');

    const board = await this.boardRepo.findOne({
      where: { id: column.boardId },
    });
    if (!board || board.ownerId !== userId)
      throw new ForbiddenException('Доступ запрещен');

    return column;
  }

  async create(dto: CreateTaskDto, userId: string): Promise<Task> {
    await this.verifyColumnOwner(dto.columnId, userId);

    if (dto.order === undefined) {
      const count = await this.taskRepo.count({
        where: { columnId: dto.columnId },
      });
      dto.order = count;
    }

    const task = this.taskRepo.create(dto);
    return this.taskRepo.save(task);
  }

  async update(id: string, dto: UpdateTaskDto, userId: string): Promise<Task> {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Задача не найдена');
    await this.verifyColumnOwner(task.columnId, userId);

    Object.assign(task, dto);
    return this.taskRepo.save(task);
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Задача не найдена');
    await this.verifyColumnOwner(task.columnId, userId);
    await this.taskRepo.remove(task);
  }

  async move(id: string, dto: MoveTaskDto, userId: string): Promise<Task> {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Задача не найдена');
    await this.verifyColumnOwner(task.columnId, userId);
    await this.verifyColumnOwner(dto.columnId, userId);

    await this.taskRepo
      .createQueryBuilder()
      .update(Task)
      .set({ order: () => '"order" + 1' })
      .where('"columnId" = :columnId AND "order" >= :order', {
        columnId: dto.columnId,
        order: dto.order,
      })
      .execute();

    task.columnId = dto.columnId;
    task.order = dto.order;
    return this.taskRepo.save(task);
  }

  async reorder(
    dto: ReorderTasksDto,
    columnId: string,
    userId: string,
  ): Promise<void> {
    await this.verifyColumnOwner(columnId, userId);
    const updates = dto.taskIds.map((taskId, index) =>
      this.taskRepo.update({ id: taskId, columnId }, { order: index }),
    );
    await Promise.all(updates);
  }
}
