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
} from 'class-validator';
import { TaskPriority } from '../entities/task.entity';

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
