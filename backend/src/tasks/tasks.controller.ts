import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import {
  AnalyticsItemDto,
  AnalyticsQueryDto,
  CompletionSummaryDto,
  CreateTaskDto,
  MoveTaskDto,
  ReorderTasksDto,
  TaskResponseDto,
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
  @ApiCreatedResponse({ type: TaskResponseDto })
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: User) {
    return this.tasksService.create(dto, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Изменить задачу' })
  @ApiOkResponse({ type: TaskResponseDto })
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
  @ApiOkResponse({ type: TaskResponseDto })
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
  @ApiNoContentResponse()
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
  @ApiNoContentResponse()
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tasksService.remove(id, user.id);
  }

  @Get('analytics/daily')
  @ApiOperation({ summary: 'Статистика выполненных задач по дням' })
  @ApiOkResponse({ type: AnalyticsItemDto, isArray: true })
  analyticsDaily(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.getDailyAnalytics(user.id, query);
  }

  @Get('analytics/monthly')
  @ApiOperation({ summary: 'Статистика выполненных задач по месяцам' })
  @ApiOkResponse({ type: AnalyticsItemDto, isArray: true })
  analyticsMonthly(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.getMonthlyAnalytics(user.id, query);
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Сводка по выполнению задач в срок и с опозданием' })
  @ApiOkResponse({ type: CompletionSummaryDto })
  analyticsSummary(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.getCompletionSummary(user.id, query);
  }
}
