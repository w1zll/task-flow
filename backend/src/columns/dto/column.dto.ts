import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateColumnDto {
  @ApiProperty({ example: 'To Do' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'board-uuid' })
  @IsUUID()
  boardId: string;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateColumnDto extends PartialType(CreateColumnDto) {}

export class ReorderColumnsDto {
  @ApiProperty({ description: 'UUIDs of columns' })
  columnsIds: string[];
}
