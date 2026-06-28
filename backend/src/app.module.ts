import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { Board } from './boards/entities/board.entity';
import { BoardMember } from './boards/entities/board-member.entity';
import { BoardView } from './boards/entities/board-view.entity';
import { Column } from './columns/entities/column.entity';
import { Task } from './tasks/entities/task.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BoardsModule } from './boards/boards.module';
import { ColumnsModule } from './columns/columns.module';
import { TasksModule } from './tasks/tasks.module';
import { FrontendCacheModule } from './common/frontend-cache/frontend-cache.module';
import { StorageModule } from './storage/storage.module';
import { Workspace } from './workspaces/entities/workspace.entity';
import { WorkspaceMember } from './workspaces/entities/workspace-member.entity';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { WorkspaceInvite } from './workspaces/entities/workspace-invite.entity';
import { WorkspaceInviteAuditEvent } from './workspaces/entities/workspace-invite-audit-event.entity';
import { Team } from './teams/entities/team.entity';
import { TeamMember } from './teams/entities/team-member.entity';
import { TeamsModule } from './teams/teams.module';
import { DemoModule } from './demo/demo.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get('DATABASE_URL');

        return {
          type: 'postgres',
          url: databaseUrl ?? undefined,
          host: config.get('DB_HOST'),
          port: config.get<number>('DB_PORT'),
          username: config.get('DB_USERNAME'),
          password: config.get('DB_PASSWORD'),
          database: config.get('DB_NAME'),
          entities: [
            User,
            Workspace,
            WorkspaceMember,
            WorkspaceInvite,
            WorkspaceInviteAuditEvent,
            Team,
            TeamMember,
            Board,
            BoardMember,
            BoardView,
            Column,
            Task,
            RefreshToken,
          ],
          synchronize: false,
          // synchronize: process.env.NODE_ENV === 'development',
          // logging: config.get('NODE_ENV') === 'development',
        };
      },
    }),

    AuthModule,
    StorageModule,
    FrontendCacheModule,
    UsersModule,
    WorkspacesModule,
    TeamsModule,
    DemoModule,
    BoardsModule,
    ColumnsModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
