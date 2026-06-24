import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { TaskPriority } from '../entities/task.entity';
import { UserResponseDto } from '@/users/dto/user.dto';

export class CreateTaskDto {
  @ApiProperty({ example: 'Task 1' })
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({ required: false, example: ['Label 1', 'Label 2'] })
  @IsOptional()
  @IsArray()
  labels?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false, example: 'assignee-user-uuid' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @ApiProperty({ required: false, example: '2026-05-05T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assigneeName?: string;

  @ApiProperty({ example: 'column-uuid' })
  @IsUUID()
  columnId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class TaskResponseDto {
  @ApiProperty({ example: 'task-uuid' })
  id: string;

  @ApiProperty({ example: 'Task 1' })
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @ApiProperty({ example: 0 })
  order: number;

  @ApiProperty({ required: false, example: ['Label 1', 'Label 2'] })
  labels?: string[];

  @ApiProperty({ required: false, example: '2026-05-05T12:00:00.000Z' })
  dueDate?: string;

  @ApiProperty({ required: false, example: 'assignee-user-uuid' })
  assigneeId?: string;

  @ApiProperty({ required: false })
  assigneeName?: string;

  @ApiProperty({ type: () => UserResponseDto, required: false })
  assignee?: UserResponseDto;

  @ApiProperty({ required: false })
  isCompleted: boolean;

  @ApiProperty({ required: false, example: '2026-05-05T12:00:00.000Z' })
  completedAt?: string;

  @ApiProperty({ example: 'column-uuid' })
  columnId: string;

  @ApiProperty({ example: '2026-05-05T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-05T12:00:00.000Z' })
  updatedAt: string;
}

export class MoveTaskDto {
  @ApiProperty({ description: 'ID новой колонки' })
  @IsUUID()
  columnId: string;

  @ApiProperty({ description: 'Новая позиция заказа' })
  @IsNumber()
  order: number;
}

export class ReorderTasksDto {
  @ApiProperty({ description: 'Массив тасок в новой последовательности' })
  @IsArray()
  @IsUUID('4', { each: true })
  taskIds: string[];
}

export class AnalyticsQueryDto {
  @ApiProperty({ required: false, example: 'board-uuid' })
  @IsOptional()
  @IsUUID()
  boardId?: string;

  @ApiProperty({ required: false, example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({ required: false, example: '2026-05-31' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class AnalyticsItemDto {
  @ApiProperty({ example: '2026-05-05' })
  period: string;

  @ApiProperty({ example: 12 })
  count: number;
}

export class CompletionSummaryDto {
  @ApiProperty({ example: 24 })
  total: number;

  @ApiProperty({ example: 18 })
  onTime: number;

  @ApiProperty({ example: 6 })
  late: number;
}
