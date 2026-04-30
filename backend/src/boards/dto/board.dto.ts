import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

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
