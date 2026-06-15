import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { BoardMember } from './entities/board-member.entity';
import { User } from '@/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateBoardDto, ShareBoardDto, UpdateBoardDto } from './dto/board.dto';
import { Column } from '@/columns/entities/column.entity';
import { Task } from '@/tasks/entities/task.entity';
import {
  BoardTemplate,
  SCRUM_COLUMN_KEYS,
  createScrumColumns,
  createWelcomeTasks,
  getWelcomeBoardText,
} from './board-templates';
import { AppLocale } from '@/common/locale/request-locale';
import { FrontendCacheService } from '@/common/frontend-cache/frontend-cache.service';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepo: Repository<Board>,

    @InjectRepository(BoardMember)
    private readonly memberRepo: Repository<BoardMember>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Column)
    private readonly columnRepo: Repository<Column>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    private readonly frontendCache: FrontendCacheService,
  ) {}

  async findAll(userId: string): Promise<Board[]> {
    return this.boardRepo
      .createQueryBuilder('board')
      .leftJoin('board.members', 'member')
      .where('board.ownerId = :userId OR member.userId = :userId', {
        userId,
      })
      .orderBy('board.createdAt', 'DESC')
      .distinct(true)
      .getMany();
  }

  async findOne(id: string, userId: string): Promise<Board> {
    const board = await this.boardRepo.findOne({
      where: { id },
      relations: ['columns', 'columns.tasks', 'members', 'members.user'],
      order: {
        columns: { order: 'ASC' },
      } as any,
    });

    if (!board) throw new NotFoundException('Доска не найдена');
    if (
      !(
        board.ownerId === userId ||
        board.members?.some((m) => m.userId === userId)
      )
    ) {
      throw new ForbiddenException('Доступ запрещен');
    }

    board.columns.forEach((col) => {
      col.tasks?.sort((a, b) => a.order - b.order);
    });
    return board;
  }

  async ensureAccess(id: string, userId: string): Promise<void> {
    const board = await this.boardRepo.findOne({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!board) throw new NotFoundException('Доска не найдена');
    if (board.ownerId === userId) return;
    if (await this.isBoardMember(id, userId)) return;

    throw new ForbiddenException('Доступ запрещен');
  }

  async create(
    dto: CreateBoardDto,
    userId: string,
    locale: AppLocale = 'en',
  ): Promise<Board> {
    const { template = BoardTemplate.EMPTY, ...boardDto } = dto;
    const board = await this.boardRepo.save(
      this.boardRepo.create({ ...boardDto, ownerId: userId }),
    );

    if (template === BoardTemplate.SCRUM) {
      board.columns = await this.createScrumColumnsForBoard(board.id, locale);
    }

    return board;
  }

  async createWelcomeBoard(
    userId: string,
    registeredAt = new Date(),
    locale: AppLocale = 'en',
  ): Promise<Board> {
    const boardText = getWelcomeBoardText(locale);
    const board = await this.boardRepo.save(
      this.boardRepo.create({
        title: boardText.title,
        description: boardText.description,
        color: '#6366f1',
        ownerId: userId,
      }),
    );

    const columns = await this.createScrumColumnsForBoard(board.id, locale);
    const columnsByKey = Object.fromEntries(
      columns.map((column, index) => [SCRUM_COLUMN_KEYS[index], column]),
    ) as Record<(typeof SCRUM_COLUMN_KEYS)[number], Column>;
    const tasks = this.taskRepo.create(
      createWelcomeTasks(columnsByKey, registeredAt, locale),
    );

    const savedTasks = await this.taskRepo.save(tasks);

    board.columns = columns.map((column) => ({
      ...column,
      tasks: savedTasks
        .filter((task) => task.columnId === column.id)
        .sort((a, b) => a.order - b.order),
    }));

    return board;
  }

  private async createScrumColumnsForBoard(
    boardId: string,
    locale: AppLocale,
  ): Promise<Column[]> {
    const columns = this.columnRepo.create(createScrumColumns(boardId, locale));
    return this.columnRepo.save(columns);
  }

  async update(
    id: string,
    dto: UpdateBoardDto,
    userId: string,
  ): Promise<Board> {
    const board = await this.findOne(id, userId);
    Object.assign(board, dto);
    const saved = await this.boardRepo.save(board);
    await this.frontendCache.revalidateBoard(id);
    return saved;
  }

  async remove(id: string, userId: string): Promise<void> {
    const board = await this.findOne(id, userId);
    await this.boardRepo.remove(board);
    await this.frontendCache.revalidateBoard(id);
  }

  async share(
    boardId: string,
    dto: ShareBoardDto,
    userId: string,
  ): Promise<BoardMember> {
    const board = await this.boardRepo.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Доска не найдена');
    if (board.ownerId !== userId)
      throw new ForbiddenException('Только владелец может делиться доской');

    const target = dto.userId
      ? await this.userRepo.findOne({ where: { id: dto.userId } })
      : dto.email
        ? await this.userRepo.findOne({ where: { email: dto.email } })
        : null;

    if (!target) {
      throw new NotFoundException('Пользователь для приглашения не найден');
    }

    if (target.id === userId) {
      throw new ForbiddenException('Владелец уже имеет доступ к доске');
    }

    const existing = await this.memberRepo.findOne({
      where: { boardId, userId: target.id },
    });
    if (existing) return existing;

    const member = this.memberRepo.create({ boardId, userId: target.id });
    const saved = await this.memberRepo.save(member);
    const boardMember = await this.memberRepo.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });
    await this.frontendCache.revalidateBoard(boardId);
    return boardMember;
  }

  async listMembers(boardId: string, userId: string): Promise<BoardMember[]> {
    const board = await this.boardRepo.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Доска не найдена');
    if (
      board.ownerId !== userId &&
      !(await this.isBoardMember(boardId, userId))
    ) {
      throw new ForbiddenException('Доступ запрещен');
    }

    const owner = await this.userRepo.findOne({ where: { id: board.ownerId } });
    const members = await this.memberRepo.find({
      where: { boardId },
      relations: ['user'],
    });
    const ownerAsMember = {
      id: null,
      boardId,
      userId: board.ownerId,
      user: owner,
    } as unknown as BoardMember;
    return [ownerAsMember, ...members];

    // return [
    //   this.userRepo.findOne({ where: { id: userId } }),
    //   ...this.memberRepo.find({
    //     where: { boardId },
    //     relations: ['user'],
    //   }),
    // ];
  }

  async revokeMember(
    boardId: string,
    memberId: string,
    userId: string,
  ): Promise<void> {
    const board = await this.boardRepo.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Доска не найдена');
    if (board.ownerId !== userId)
      throw new ForbiddenException('Только владелец может отзывать доступ');

    const member = await this.memberRepo.findOne({ where: { id: memberId } });
    if (!member || member.boardId !== boardId) {
      throw new NotFoundException('Участник не найден');
    }

    await this.memberRepo.remove(member);
    await this.frontendCache.revalidateBoard(boardId);
  }

  private async isBoardMember(
    boardId: string,
    userId: string,
  ): Promise<boolean> {
    const count = await this.memberRepo.count({ where: { boardId, userId } });
    return count > 0;
  }
}
