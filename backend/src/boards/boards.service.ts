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

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepo: Repository<Board>,

    @InjectRepository(BoardMember)
    private readonly memberRepo: Repository<BoardMember>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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
    if (!(board.ownerId === userId || board.members?.some((m) => m.userId === userId))) {
      throw new ForbiddenException('Доступ запрещен');
    }

    board.columns.forEach((col) => {
      col.tasks?.sort((a, b) => a.order - b.order);
    });

    return board;
  }

  async create(dto: CreateBoardDto, userId: string): Promise<Board> {
    const board = this.boardRepo.create({ ...dto, ownerId: userId });
    return this.boardRepo.save(board);
  }

  async update(
    id: string,
    dto: UpdateBoardDto,
    userId: string,
  ): Promise<Board> {
    const board = await this.findOne(id, userId);
    Object.assign(board, dto);
    return this.boardRepo.save(board);
  }

  async remove(id: string, userId: string): Promise<void> {
    const board = await this.findOne(id, userId);
    await this.boardRepo.remove(board);
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
    return this.memberRepo.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });
  }

  async listMembers(boardId: string, userId: string): Promise<BoardMember[]> {
    const board = await this.boardRepo.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Доска не найдена');
    if (board.ownerId !== userId && !(await this.isBoardMember(boardId, userId))) {
      throw new ForbiddenException('Доступ запрещен');
    }

    return this.memberRepo.find({
      where: { boardId },
      relations: ['user'],
    });
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
  }

  private async isBoardMember(boardId: string, userId: string): Promise<boolean> {
    const count = await this.memberRepo.count({ where: { boardId, userId } });
    return count > 0;
  }
}
