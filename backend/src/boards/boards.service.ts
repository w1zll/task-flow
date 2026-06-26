import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Column } from '@/columns/entities/column.entity';
import { AppLocale } from '@/common/locale/request-locale';
import { FrontendCacheService } from '@/common/frontend-cache/frontend-cache.service';
import { Task } from '@/tasks/entities/task.entity';
import { User } from '@/users/entities/user.entity';
import { toPublicUser } from '@/users/public-user';
import {
  BoardTemplate,
  SCRUM_COLUMN_KEYS,
  createScrumColumns,
  createWelcomeTasks,
  getWelcomeBoardText,
} from './board-templates';
import {
  BoardAccess,
  BoardPermissionsService,
} from './board-permissions.service';
import { CreateBoardDto, ShareBoardDto, UpdateBoardDto } from './dto/board.dto';
import { BoardMember } from './entities/board-member.entity';
import { BoardRole } from './entities/board-role.enum';
import { Board } from './entities/board.entity';
import { WorkspacesService } from '@/workspaces/workspaces.service';

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
    private readonly boardPermissions: BoardPermissionsService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async findAll(userId: string): Promise<Board[]> {
    const boards = await this.boardRepo
      .createQueryBuilder('board')
      .leftJoin('board.members', 'member')
      .where('(board.ownerId = :userId OR member.userId = :userId)', {
        userId,
      })
      .orderBy('board.createdAt', 'DESC')
      .distinct(true)
      .getMany();

    return Promise.all(
      boards.map(async (board) =>
        this.attachAccess(
          board,
          await this.boardPermissions.getAccess(board.id, userId),
        ),
      ),
    );
  }

  async findOne(id: string, userId: string): Promise<Board> {
    const board = await this.boardRepo.findOne({
      where: { id },
      relations: [
        'columns',
        'columns.tasks',
        'columns.tasks.assignee',
        'columns.tasks.team',
        'members',
        'members.user',
      ],
      order: {
        columns: { order: 'ASC' },
      } as any,
    });
    if (!board) throw new NotFoundException('Board not found');

    const access = await this.boardPermissions.assertCanRead(id, userId);
    board.columns?.forEach((column) => {
      column.tasks?.forEach((task) => {
        if (task.assignee) task.assignee = toPublicUser(task.assignee);
      });
      column.tasks?.sort((a, b) => a.order - b.order);
    });
    board.members?.forEach((member) => {
      member.user = toPublicUser(member.user);
    });
    const owner = await this.userRepo.findOne({ where: { id: board.ownerId } });
    if (owner) {
      const ownerAsMember = {
        id: null,
        boardId: board.id,
        userId: board.ownerId,
        user: toPublicUser(owner),
        role: BoardRole.OWNER,
        invitedById: null,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      } as unknown as BoardMember;
      board.members = [ownerAsMember, ...(board.members ?? [])];
    }

    return this.attachAccess(board, access);
  }

  async ensureAccess(id: string, userId: string): Promise<void> {
    await this.boardPermissions.assertCanRead(id, userId);
  }

  async create(
    dto: CreateBoardDto,
    userId: string,
    locale: AppLocale = 'en',
  ): Promise<Board> {
    const {
      template = BoardTemplate.EMPTY,
      workspaceId: requestedWorkspaceId,
      ...boardDto
    } = dto;
    const workspaceAccess = requestedWorkspaceId
      ? await this.workspacesService.assertMember(
          requestedWorkspaceId,
          userId,
        )
      : await this.workspacesService.getActiveWorkspace(userId);
    const board = await this.boardRepo.save(
      this.boardRepo.create({
        ...boardDto,
        ownerId: userId,
        workspaceId: workspaceAccess.workspace.id,
      }),
    );

    if (template === BoardTemplate.SCRUM) {
      board.columns = await this.createScrumColumnsForBoard(board.id, locale);
    }

    return this.attachRole(board, BoardRole.OWNER);
  }

  async createWelcomeBoard(
    userId: string,
    workspaceId: string,
    registeredAt = new Date(),
    locale: AppLocale = 'en',
  ): Promise<Board> {
    const boardText = getWelcomeBoardText(locale);
    const board = await this.boardRepo.save(
      this.boardRepo.create({
        title: boardText.title,
        description: boardText.description,
        color: '#669266',
        ownerId: userId,
        workspaceId,
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

    return this.attachRole(board, BoardRole.OWNER);
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
    const access =
      await this.boardPermissions.assertCanManageBoardSettings(id, userId);
    const board = await this.boardRepo.findOne({ where: { id } });
    if (!board) throw new NotFoundException('Board not found');

    Object.assign(board, dto);
    const saved = await this.boardRepo.save(board);
    await this.frontendCache.revalidateBoard(id);
    return this.attachAccess(saved, access);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.boardPermissions.assertCanDeleteBoard(id, userId);
    const board = await this.boardRepo.findOne({ where: { id } });
    if (!board) throw new NotFoundException('Board not found');

    await this.boardRepo.remove(board);
    await this.frontendCache.revalidateBoard(id);
  }

  async share(
    boardId: string,
    dto: ShareBoardDto,
    userId: string,
  ): Promise<BoardMember> {
    await this.boardPermissions.assertCanManageBoardMembers(boardId, userId);
    const board = await this.boardRepo.findOne({
      where: { id: boardId },
      select: { id: true, workspaceId: true },
    });
    if (!board) throw new NotFoundException('Board not found');

    const target = dto.userId
      ? await this.userRepo.findOne({ where: { id: dto.userId } })
      : dto.email
        ? await this.userRepo.findOne({ where: { email: dto.email } })
        : null;
    if (!target) {
      throw new NotFoundException('User to invite was not found');
    }
    if (target.id === userId) {
      throw new ForbiddenException('The board owner already has access');
    }
    try {
      await this.workspacesService.assertMember(
        board.workspaceId,
        target.id,
      );
    } catch {
      throw new ForbiddenException(
        'The user must belong to the board workspace',
      );
    }

    const existing = await this.memberRepo.findOne({
      where: { boardId, userId: target.id },
      relations: ['user'],
    });
    if (existing) {
      existing.user = toPublicUser(existing.user);
      return existing;
    }

    const member = this.memberRepo.create({
      boardId,
      userId: target.id,
      role: dto.role ?? BoardRole.EDITOR,
      invitedById: userId,
    });
    const saved = await this.memberRepo.save(member);
    const boardMember = await this.memberRepo.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });
    boardMember.user = toPublicUser(boardMember.user);
    await this.frontendCache.revalidateBoard(boardId);
    return boardMember;
  }

  async listMembers(boardId: string, userId: string): Promise<BoardMember[]> {
    await this.boardPermissions.assertCanRead(boardId, userId);
    const board = await this.boardRepo.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');

    const owner = await this.userRepo.findOne({ where: { id: board.ownerId } });
    const members = (
      await this.memberRepo.find({
        where: { boardId },
        relations: ['user'],
      })
    ).map((member) => ({
      ...member,
      user: toPublicUser(member.user),
    })) as BoardMember[];
    const ownerAsMember = {
      id: null,
      boardId,
      userId: board.ownerId,
      user: toPublicUser(owner),
      role: BoardRole.OWNER,
      invitedById: null,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    } as unknown as BoardMember;

    return [ownerAsMember, ...members];
  }

  async revokeMember(
    boardId: string,
    memberId: string,
    userId: string,
  ): Promise<void> {
    await this.boardPermissions.assertCanManageBoardMembers(boardId, userId);
    const member = await this.memberRepo.findOne({ where: { id: memberId } });
    if (!member || member.boardId !== boardId) {
      throw new NotFoundException('Board member not found');
    }

    await this.memberRepo.remove(member);
    await this.frontendCache.revalidateBoard(boardId);
  }

  async updateMemberRole(
    boardId: string,
    memberId: string,
    role: BoardRole.EDITOR | BoardRole.VIEWER,
    userId: string,
  ): Promise<BoardMember> {
    await this.boardPermissions.assertCanManageBoardMembers(boardId, userId);
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
      relations: ['user'],
    });
    if (!member || member.boardId !== boardId) {
      throw new NotFoundException('Board member not found');
    }

    member.role = role;
    const saved = await this.memberRepo.save(member);
    saved.user = toPublicUser(saved.user);
    await this.frontendCache.revalidateBoard(boardId);
    return saved;
  }

  private attachRole(board: Board, role: BoardRole): Board {
    return this.attachAccess(board, {
      role,
      capabilities: this.boardPermissions.getCapabilities(role),
    });
  }

  private attachAccess(board: Board, access: BoardAccess): Board {
    return Object.assign(board, {
      currentUserRole: access.role,
      capabilities: access.capabilities,
    });
  }
}
