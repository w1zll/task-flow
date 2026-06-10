import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { Board } from './boards/entities/board.entity';
import { BoardMember } from './boards/entities/board-member.entity';
import { Column } from './columns/entities/column.entity';
import { Task } from './tasks/entities/task.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BoardsModule } from './boards/boards.module';
import { ColumnsModule } from './columns/columns.module';
import { TasksModule } from './tasks/tasks.module';
import { FrontendCacheModule } from './common/frontend-cache/frontend-cache.module';

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
          entities: [User, Board, BoardMember, Column, Task, RefreshToken],
          synchronize: process.env.NODE_ENV === 'development',
          // logging: config.get('NODE_ENV') === 'development',
        };
      },
    }),

    AuthModule,
    FrontendCacheModule,
    UsersModule,
    BoardsModule,
    ColumnsModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
