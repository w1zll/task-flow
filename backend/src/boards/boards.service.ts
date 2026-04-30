import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { Repository } from 'typeorm';
import { CreateBoardDto, UpdateBoardDto } from './dto/board.dto';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepo: Repository<Board>,
  ) {}

  async findAll(userId: string): Promise<Board[]> {
    return this.boardRepo.find({
      where: { ownerId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Board> {
    const board = await this.boardRepo.findOne({
      where: { id },
      relations: ['columns', 'columns.tasks'],
      order: {
        columns: { order: 'ASC' },
      } as any,
    });

    if (!board) throw new NotFoundException('Доска не найдена');
    if (board.ownerId !== userId)
      throw new ForbiddenException('Доступ запрещен');

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
}
