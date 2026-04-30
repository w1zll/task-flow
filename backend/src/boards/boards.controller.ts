import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { User } from '@/users/entities/user.entity';
import { CreateBoardDto } from './dto/board.dto';

@ApiTags('boards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить все доски авторизованного пользователя' })
  findAll(@CurrentUser() user: User) {
    return this.boardsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить доску по id' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.boardsService.findOne(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать доску' })
  create(@Body() dto: CreateBoardDto, @CurrentUser() user: User) {
    return this.boardsService.create(dto, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить доску' })
  update(
    @Param('id') id: string,
    @Body() dto: CreateBoardDto,
    @CurrentUser() user: User,
  ) {
    return this.boardsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить доску' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.boardsService.remove(id, user.id);
  }
}
