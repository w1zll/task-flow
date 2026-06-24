import { ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BoardPermissionsService } from '@/boards/board-permissions.service';
import { FrontendCacheService } from '@/common/frontend-cache/frontend-cache.service';
import { ColumnsService } from './column.service';
import { Column } from './entities/column.entity';

describe('ColumnsService permissions', () => {
  let service: ColumnsService;
  let columnRepo: jest.Mocked<Partial<Repository<Column>>>;
  let boardPermissions: jest.Mocked<Partial<BoardPermissionsService>>;

  beforeEach(() => {
    columnRepo = {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((data) => data as Column),
      save: jest.fn(async (column: Column) => ({
        ...column,
        id: 'column-1',
      })),
    };
    boardPermissions = {
      assertCanManageColumns: jest.fn().mockResolvedValue({} as never),
    };
    service = new ColumnsService(
      columnRepo as Repository<Column>,
      { revalidateBoard: jest.fn() } as unknown as FrontendCacheService,
      boardPermissions as BoardPermissionsService,
    );
  });

  it('allows an editor to create a column', async () => {
    await service.create(
      { title: 'In progress', boardId: 'board-1' },
      'editor-1',
    );

    expect(boardPermissions.assertCanManageColumns).toHaveBeenCalledWith(
      'board-1',
      'editor-1',
    );
    expect(columnRepo.save).toHaveBeenCalled();
  });

  it('does not allow a viewer to create a column', async () => {
    boardPermissions.assertCanManageColumns!.mockRejectedValueOnce(
      new ForbiddenException(),
    );

    await expect(
      service.create({ title: 'Blocked', boardId: 'board-1' }, 'viewer-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(columnRepo.save).not.toHaveBeenCalled();
  });
});
