import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { DemoService } from './demo.service';

describe('DemoService', () => {
  let service: DemoService;
  let dataSource: {
    getRepository: jest.Mock;
    transaction: jest.Mock;
  };
  let userRepo: {
    findOne: jest.Mock;
  };
  let config: {
    get: jest.Mock;
  };

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
    };
    dataSource = {
      getRepository: jest.fn((entity) => {
        if (entity === User) return userRepo;
        throw new Error('Unexpected repository');
      }),
      transaction: jest.fn(),
    };
    config = {
      get: jest.fn((key: string) => {
        if (key === 'ENABLE_DEMO_MODE') return 'true';
        if (key === 'DEMO_OWNER_EMAIL') return 'demo-owner@taskflow.local';
        return undefined;
      }),
    };
    service = new DemoService(
      dataSource as unknown as DataSource,
      config as unknown as ConfigService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('hides demo login when demo mode is disabled', async () => {
    config.get.mockImplementation((key: string) =>
      key === 'ENABLE_DEMO_MODE' ? 'false' : undefined,
    );

    await expect(service.startDemoSession()).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('allows reset only for the configured demo owner', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'regular@taskflow.local',
    });

    await expect(service.resetDemoWorkspace('user-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('resets demo data for the configured demo owner', async () => {
    const session = {
      user: {
        id: 'demo-owner',
        email: 'demo-owner@taskflow.local',
        name: 'Demo Owner',
      } as User,
      workspaceId: 'workspace-1',
      boardId: 'board-1',
    };
    userRepo.findOne.mockResolvedValue({
      id: 'demo-owner',
      email: 'demo-owner@taskflow.local',
    });
    jest.spyOn(service, 'seedSharedDemoWorkspace').mockResolvedValue(session);

    await expect(
      service.resetDemoWorkspace('demo-owner'),
    ).resolves.toEqual(session);
  });
});
