import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ColumnResponseDto } from '@/columns/dto/column.dto';

export class CreateBoardDto {
  @ApiProperty({ example: 'Board 1' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Board 1 description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '#6366f1', required: false })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Неверный формат кода' })
  color?: string;
}

export class UpdateBoardDto extends PartialType(CreateBoardDto) {}

export class BoardResponseDto {
  @ApiProperty({ example: 'board-uuid' })
  id: string;

  @ApiProperty({ example: 'Board 1' })
  title: string;

  @ApiProperty({ example: 'Board 1 description', required: false })
  description?: string;

  @ApiProperty({ example: '#6366f1', required: false })
  color?: string;

  @ApiProperty({ example: 'user-uuid' })
  ownerId: string;

  @ApiProperty({ type: () => ColumnResponseDto, isArray: true, required: false })
  columns?: ColumnResponseDto[];

  @ApiProperty({ example: '2026-05-05T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-05T12:00:00.000Z' })
  updatedAt: string;
}
