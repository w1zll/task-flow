import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Column } from '@/columns/entities/column.entity';
import { Board } from '@/boards/entities/board.entity';
import { User } from '@/users/entities/user.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { BoardPermissionsModule } from '@/boards/board-permissions.module';
import { WorkspacesModule } from '@/workspaces/workspaces.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Column, Board, User]),
    BoardPermissionsModule,
    WorkspacesModule,
  ],
  providers: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}
