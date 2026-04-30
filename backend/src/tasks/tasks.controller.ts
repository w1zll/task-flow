import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  MoveTaskDto,
  ReorderTasksDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { User } from '@/users/entities/user.entity';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Создать задачу в колонке' })
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: User) {
    return this.tasksService.create(dto, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Изменить задачу' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.update(id, dto, user.id);
  }

  @Patch(':id/move')
  @ApiOperation({
    summary: 'Переместить задачу в другую колонку (drag & drop)',
  })
  move(
    @Param('id') id: string,
    @Body() dto: MoveTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.move(id, dto, user.id);
  }

  @Put('column/:columnId/reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Переупорядочить задачи в колонке' })
  reorder(
    @Param('columnId') columnId: string,
    @Body() dto: ReorderTasksDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.reorder(dto, columnId, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить задачу' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tasksService.remove(id, user.id);
  }
}
