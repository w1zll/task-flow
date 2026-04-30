import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Column } from './entities/column.entity';
import { Board } from '@/boards/entities/board.entity';
import { ColumnsService } from './column.service';
import { ColumnsController } from './columns.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Column, Board])],
  providers: [ColumnsService],
  controllers: [ColumnsController],
})
export class ColumnsModule {}
