import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardPermissionsService } from '@/boards/board-permissions.service';
import { FrontendCacheService } from '@/common/frontend-cache/frontend-cache.service';
import {
  CreateColumnDto,
  ReorderColumnsDto,
  UpdateColumnDto,
} from './dto/column.dto';
import { Column } from './entities/column.entity';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectRepository(Column)
    private readonly columnRepo: Repository<Column>,
    private readonly frontendCache: FrontendCacheService,
    private readonly boardPermissions: BoardPermissionsService,
  ) {}

  async create(dto: CreateColumnDto, userId: string): Promise<Column> {
    await this.boardPermissions.assertCanManageColumns(dto.boardId, userId);
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
    if (!column) throw new NotFoundException('Column not found');
    await this.boardPermissions.assertCanManageColumns(column.boardId, userId);

    Object.assign(column, dto);
    const saved = await this.columnRepo.save(column);
    await this.frontendCache.revalidateBoard(column.boardId);
    return saved;
  }

  async remove(id: string, userId: string): Promise<void> {
    const column = await this.columnRepo.findOne({ where: { id } });
    if (!column) throw new NotFoundException('Column not found');
    await this.boardPermissions.assertCanManageColumns(column.boardId, userId);

    const { boardId } = column;
    await this.columnRepo.remove(column);
    await this.frontendCache.revalidateBoard(boardId);
  }

  async reorder(
    dto: ReorderColumnsDto,
    boardId: string,
    userId: string,
  ): Promise<void> {
    await this.boardPermissions.assertCanManageColumns(boardId, userId);

    const updates = dto.columnIds.map((columnId, index) =>
      this.columnRepo.update({ id: columnId, boardId }, { order: index }),
    );
    await Promise.all(updates);
    await this.frontendCache.revalidateBoard(boardId);
  }
}
