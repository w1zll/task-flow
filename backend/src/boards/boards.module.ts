import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { BoardMember } from './entities/board-member.entity';
import { User } from '@/users/entities/user.entity';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';
import { JwtModule } from '@nestjs/jwt';
import { Task } from '@/tasks/entities/task.entity';
import { BoardGateway } from './boards.gateway';
import { WsJwtGuard } from '@/auth/guards/ws-jwt.guard';
import { TasksService } from '@/tasks/tasks.service';
import { Column } from '@/columns/entities/column.entity';
import { AuthModule } from '@/auth/auth.module';
import { BoardPermissionsModule } from './board-permissions.module';
import { WorkspacesModule } from '@/workspaces/workspaces.module';
import { Team } from '@/teams/entities/team.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Board, BoardMember, User, Task, Column, Team]),
    forwardRef(() => AuthModule),
    BoardPermissionsModule,
    WorkspacesModule,
  ],
  providers: [BoardsService, BoardGateway, WsJwtGuard, TasksService],
  controllers: [BoardsController],
  exports: [BoardsService, BoardPermissionsModule],
})
export class BoardsModule {}
