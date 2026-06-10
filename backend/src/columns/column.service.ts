import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Column } from './entities/column.entity';
import { Repository } from 'typeorm';
import { Board } from '@/boards/entities/board.entity';
import {
  CreateColumnDto,
  ReorderColumnsDto,
  UpdateColumnDto,
} from './dto/column.dto';
import { FrontendCacheService } from '@/common/frontend-cache/frontend-cache.service';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectRepository(Column)
    private readonly columnRepo: Repository<Column>,

    @InjectRepository(Board)
    private readonly boardRepo: Repository<Board>,

    private readonly frontendCache: FrontendCacheService,
  ) {}

  private async verifyBoardOwner(
    boardId: string,
    userId: string,
  ): Promise<Board> {
    const board = await this.boardRepo.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Доска не найдена');
    if (board.ownerId !== userId)
      throw new ForbiddenException('Доступ запрещен');
    return board;
  }

  async create(dto: CreateColumnDto, userId: string): Promise<Column> {
    await this.verifyBoardOwner(dto.boardId, userId);
    if (dto.order === undefined) {
      const count = await this.columnRepo.count({
        where: { boardId: dto.boardId },
      });
      dto.order = count;
    }
    const column = this.columnRepo.create(dto);
    const saved = await this.columnRepo.save(column);
    await this.frontendCache.revalidateBoard(dto.boardId);
    return saved;
  }

  async update(
    id: string,
    dto: UpdateColumnDto,
    userId: string,
  ): Promise<Column> {
    const column = await this.columnRepo.findOne({ where: { id } });
    if (!column) throw new NotFoundException('Колонка не найдена');
    await this.verifyBoardOwner(column.boardId, userId);
    Object.assign(column, dto);
    const saved = await this.columnRepo.save(column);
    await this.frontendCache.revalidateBoard(column.boardId);
    return saved;
  }

  async remove(id: string, userId: string): Promise<void> {
    const column = await this.columnRepo.findOne({ where: { id } });
    if (!column) throw new NotFoundException('Колонка не найдена');
    await this.verifyBoardOwner(column.boardId, userId);
    const { boardId } = column;
    await this.columnRepo.remove(column);
    await this.frontendCache.revalidateBoard(boardId);
  }

  async reorder(
    dto: ReorderColumnsDto,
    boardId: string,
    userId: string,
  ): Promise<void> {
    await this.verifyBoardOwner(boardId, userId);

    const updates = dto.columnIds.map((colId, index) =>
      this.columnRepo.update({ id: colId, boardId }, { order: index }),
    );
    await Promise.all(updates);
    await this.frontendCache.revalidateBoard(boardId);
  }
}
