import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from '@/users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { BoardsService } from '@/boards/boards.service';
import { AvatarService } from '@/users/avatar.service';
import { WorkspacesService } from '@/workspaces/workspaces.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Repository<User>;
  let refreshTokenRepo: Repository<RefreshToken>;
  let jwtService: JwtService;
  let configService: ConfigService;
  let boardsService: BoardsService;
  let avatarService: AvatarService;
  let workspacesService: WorkspacesService;

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockRefreshTokenRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockBoardsService = {
    createWelcomeBoard: jest.fn(),
  };

  const mockAvatarService = {
    initializeAvatar: jest.fn(),
    updateAvatar: jest.fn(),
    resetAvatar: jest.fn(),
    removeStoredAvatar: jest.fn(),
  };

  const mockWorkspacesService = {
    createPersonalWorkspace: jest.fn(async (user: User) => {
      user.activeWorkspaceId = 'workspace-1';
      return { id: 'workspace-1' };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: BoardsService,
          useValue: mockBoardsService,
        },
        {
          provide: AvatarService,
          useValue: mockAvatarService,
        },
        {
          provide: WorkspacesService,
          useValue: mockWorkspacesService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    refreshTokenRepo = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    );
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    boardsService = module.get<BoardsService>(BoardsService);
    avatarService = module.get<AvatarService>(AvatarService);
    workspacesService = module.get<WorkspacesService>(WorkspacesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      };
      const user = {
        id: '1',
        email: dto.email,
        name: dto.name,
        password: 'hashed',
        createdAt: new Date('2026-06-10T12:00:00.000Z'),
        avatar: undefined,
      };
      const initializedUser = {
        ...user,
        avatar:
          'https://api.dicebear.com/10.x/glyphs/svg?seed=1',
      };
      const tokenPair = {
        accessToken: 'access',
        refreshToken: 'refresh',
        user: {
          id: '1',
          email: dto.email,
          name: dto.name,
          avatar: initializedUser.avatar,
          activeWorkspaceId: 'workspace-1',
        },
      };

      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue(user);
      mockUserRepo.save.mockResolvedValue(user);
      mockAvatarService.initializeAvatar.mockResolvedValue(initializedUser);
      mockJwtService.sign
        .mockReturnValueOnce('access')
        .mockReturnValueOnce('refresh');
      mockConfigService.get.mockReturnValue('secret');
      mockRefreshTokenRepo.save.mockResolvedValue({});
      mockBoardsService.createWelcomeBoard.mockResolvedValue({});

      const result = await service.register(dto);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(mockUserRepo.create).toHaveBeenCalledWith(dto);
      expect(mockUserRepo.save).toHaveBeenCalledWith(user);
      expect(avatarService.initializeAvatar).toHaveBeenCalledWith(
        user,
        undefined,
      );
      expect(boardsService.createWelcomeBoard).toHaveBeenCalledWith(
        user.id,
        'workspace-1',
        user.createdAt,
        'en',
      );
      expect(workspacesService.createPersonalWorkspace).toHaveBeenCalledWith(
        initializedUser,
        'en',
      );
      expect(result).toEqual(tokenPair);
    });

    it('should create localized welcome board on registration', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      };
      const user = {
        id: '1',
        email: dto.email,
        name: dto.name,
        password: 'hashed',
        createdAt: new Date('2026-06-10T12:00:00.000Z'),
      };

      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue(user);
      mockUserRepo.save.mockResolvedValue(user);
      mockAvatarService.initializeAvatar.mockResolvedValue(user);
      mockJwtService.sign
        .mockReturnValueOnce('access')
        .mockReturnValueOnce('refresh');
      mockConfigService.get.mockReturnValue('secret');
      mockRefreshTokenRepo.save.mockResolvedValue({});
      mockBoardsService.createWelcomeBoard.mockResolvedValue({});

      await service.register(dto, 'ru');

      expect(boardsService.createWelcomeBoard).toHaveBeenCalledWith(
        user.id,
        'workspace-1',
        user.createdAt,
        'ru',
      );
    });

    it('should pass an uploaded avatar to the avatar service', async () => {
      const dto: RegisterDto = {
        email: 'avatar@example.com',
        password: 'password',
        name: 'Avatar User',
      };
      const user = {
        id: 'avatar-user',
        ...dto,
        createdAt: new Date('2026-06-10T12:00:00.000Z'),
      };
      const avatarFile = {
        buffer: Buffer.from('avatar'),
        mimetype: 'image/png',
        originalname: 'avatar.png',
        size: 6,
      };

      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue(user);
      mockUserRepo.save.mockResolvedValue(user);
      mockAvatarService.initializeAvatar.mockResolvedValue({
        ...user,
        avatar: '/api/storage/avatars/avatar.png',
      });
      mockBoardsService.createWelcomeBoard.mockResolvedValue({});
      mockJwtService.sign
        .mockReturnValueOnce('access')
        .mockReturnValueOnce('refresh');
      mockConfigService.get.mockReturnValue('secret');
      mockRefreshTokenRepo.save.mockResolvedValue({});

      await service.register(dto, 'en', avatarFile);

      expect(avatarService.initializeAvatar).toHaveBeenCalledWith(
        user,
        avatarFile,
      );
    });

    it('should throw ConflictException if user already exists', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      };
      mockUserRepo.findOne.mockResolvedValue({ id: '1', email: dto.email });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(mockBoardsService.createWelcomeBoard).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'password' };
      const user = {
        id: '1',
        email: dto.email,
        name: 'Test',
        password: 'hashed',
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      const tokenPair = {
        accessToken: 'access',
        refreshToken: 'refresh',
        user: {
          id: '1',
          email: dto.email,
          name: 'Test',
          avatar: undefined,
          activeWorkspaceId: undefined,
        },
      };

      mockUserRepo.findOne.mockResolvedValue(user);
      mockJwtService.sign
        .mockReturnValueOnce('access')
        .mockReturnValueOnce('refresh');
      mockConfigService.get.mockReturnValue('secret');
      mockRefreshTokenRepo.save.mockResolvedValue({});

      const result = await service.login(dto);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(user.comparePassword).toHaveBeenCalledWith(dto.password);
      expect(result).toEqual(tokenPair);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'password' };
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'password' };
      const user = {
        id: '1',
        email: dto.email,
        comparePassword: jest.fn().mockResolvedValue(false),
      };
      mockUserRepo.findOne.mockResolvedValue(user);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  // Add more tests for refresh, logout, etc.
});
