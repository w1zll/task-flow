import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { WorkspaceRole } from './entities/workspace-role.enum';
import { Workspace } from './entities/workspace.entity';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let workspaceRepo: jest.Mocked<Partial<Repository<Workspace>>>;
  let memberRepo: jest.Mocked<Partial<Repository<WorkspaceMember>>>;
  let userRepo: jest.Mocked<Partial<Repository<User>>>;

  const workspace = {
    id: 'workspace-1',
    name: 'Product Team',
    ownerId: 'user-1',
    isPersonal: false,
    createdAt: new Date('2026-06-25T00:00:00.000Z'),
    updatedAt: new Date('2026-06-25T00:00:00.000Z'),
  } as Workspace;

  beforeEach(() => {
    workspaceRepo = {
      create: jest.fn((data) => data as Workspace),
      save: jest.fn(async (value: Workspace) => ({
        ...value,
        id: value.id ?? 'workspace-1',
        createdAt: value.createdAt ?? new Date(),
        updatedAt: value.updatedAt ?? new Date(),
      })),
      findOne: jest.fn(),
      remove: jest.fn(),
    };
    memberRepo = {
      create: jest.fn((data) => data as WorkspaceMember),
      save: jest.fn(async (value: WorkspaceMember) => ({
        ...value,
        id: value.id ?? 'membership-1',
      })),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    userRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    service = new WorkspacesService(
      workspaceRepo as Repository<Workspace>,
      memberRepo as Repository<WorkspaceMember>,
      userRepo as Repository<User>,
    );
  });

  it('creates a localized personal workspace and makes it active', async () => {
    const user = {
      id: 'user-1',
      name: 'Ирина',
      activeWorkspaceId: null,
    } as User;

    const result = await service.createPersonalWorkspace(user, 'ru');

    expect(workspaceRepo.create).toHaveBeenCalledWith({
      name: 'Пространство Ирина',
      ownerId: 'user-1',
      isPersonal: true,
    });
    expect(memberRepo.create).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      userId: 'user-1',
      role: WorkspaceRole.OWNER,
    });
    expect(userRepo.update).toHaveBeenCalledWith('user-1', {
      activeWorkspaceId: 'workspace-1',
    });
    expect(user.activeWorkspaceId).toBe('workspace-1');
    expect(result.id).toBe('workspace-1');
  });

  it('lists memberships and marks the active workspace', async () => {
    userRepo.findOne!.mockResolvedValue({
      id: 'user-1',
      activeWorkspaceId: 'workspace-1',
    } as User);
    memberRepo.find!.mockResolvedValue([
      {
        id: 'membership-1',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.OWNER,
        workspace,
      } as WorkspaceMember,
      {
        id: 'membership-2',
        workspaceId: 'workspace-2',
        role: WorkspaceRole.MEMBER,
        workspace: { ...workspace, id: 'workspace-2', name: 'Design' },
      } as WorkspaceMember,
    ]);

    const result = await service.findAll('user-1');

    expect(result).toEqual([
      expect.objectContaining({
        id: 'workspace-1',
        currentUserRole: WorkspaceRole.OWNER,
        isActive: true,
      }),
      expect.objectContaining({
        id: 'workspace-2',
        currentUserRole: WorkspaceRole.MEMBER,
        isActive: false,
      }),
    ]);
  });

  it('switches only to a workspace where the user is a member', async () => {
    workspaceRepo.findOne!.mockResolvedValue(workspace);
    memberRepo.findOne!.mockResolvedValue({
      id: 'membership-1',
      workspaceId: 'workspace-1',
      userId: 'user-1',
      role: WorkspaceRole.MEMBER,
    } as WorkspaceMember);

    const result = await service.switchActive('workspace-1', 'user-1');

    expect(userRepo.update).toHaveBeenCalledWith('user-1', {
      activeWorkspaceId: 'workspace-1',
    });
    expect(result.isActive).toBe(true);
  });

  it('rejects switching to another workspace', async () => {
    workspaceRepo.findOne!.mockResolvedValue(workspace);
    memberRepo.findOne!.mockResolvedValue(null);

    await expect(
      service.switchActive('workspace-1', 'stranger-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('reports a missing workspace', async () => {
    workspaceRepo.findOne!.mockResolvedValue(null);

    await expect(
      service.assertMember('missing-workspace', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
