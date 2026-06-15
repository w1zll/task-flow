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
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { User } from '@/users/entities/user.entity';
import {
  BoardMemberResponseDto,
  BoardResponseDto,
  CreateBoardDto,
  ShareBoardDto,
  UpdateBoardDto,
} from './dto/board.dto';
import type { Request } from 'express';
import { detectRequestLocale } from '@/common/locale/request-locale';

@ApiTags('boards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('api/boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить все доски авторизованного пользователя' })
  @ApiOkResponse({ type: BoardResponseDto, isArray: true })
  findAll(@CurrentUser() user: User) {
    return this.boardsService.findAll(user.id);
  }

  @Get(':id/access')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Проверить доступ к доске' })
  @ApiNoContentResponse()
  async checkAccess(@Param('id') id: string, @CurrentUser() user: User) {
    await this.boardsService.ensureAccess(id, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить доску по id' })
  @ApiOkResponse({ type: BoardResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.boardsService.findOne(id, user.id);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Пригласить пользователя к доске' })
  @ApiOkResponse({ type: BoardMemberResponseDto })
  share(
    @Param('id') id: string,
    @Body() dto: ShareBoardDto,
    @CurrentUser() user: User,
  ) {
    return this.boardsService.share(id, dto, user.id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Получить список участников доски' })
  @ApiOkResponse({ type: BoardMemberResponseDto, isArray: true })
  members(@Param('id') id: string, @CurrentUser() user: User) {
    return this.boardsService.listMembers(id, user.id);
  }

  @Delete(':id/share/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить участника из доски' })
  @ApiNoContentResponse()
  revokeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: User,
  ) {
    return this.boardsService.revokeMember(id, memberId, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать доску' })
  @ApiCreatedResponse({ type: BoardResponseDto })
  create(
    @Body() dto: CreateBoardDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.boardsService.create(dto, user.id, detectRequestLocale(req));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить доску' })
  @ApiOkResponse({ type: BoardResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBoardDto,
    @CurrentUser() user: User,
  ) {
    return this.boardsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить доску' })
  @ApiNoContentResponse()
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.boardsService.remove(id, user.id);
  }
}
