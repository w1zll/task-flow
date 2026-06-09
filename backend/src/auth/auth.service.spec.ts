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

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Repository<User>;
  let refreshTokenRepo: Repository<RefreshToken>;
  let jwtService: JwtService;
  let configService: ConfigService;
  let boardsService: BoardsService;

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
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
      };
      const tokenPair = {
        accessToken: 'access',
        refreshToken: 'refresh',
        user: { id: '1', email: dto.email, name: dto.name, avatar: undefined },
      };

      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue(user);
      mockUserRepo.save.mockResolvedValue(user);
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
      expect(boardsService.createWelcomeBoard).toHaveBeenCalledWith(
        user.id,
        user.createdAt,
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
      mockJwtService.sign
        .mockReturnValueOnce('access')
        .mockReturnValueOnce('refresh');
      mockConfigService.get.mockReturnValue('secret');
      mockRefreshTokenRepo.save.mockResolvedValue({});
      mockBoardsService.createWelcomeBoard.mockResolvedValue({});

      await service.register(dto, 'ru');

      expect(boardsService.createWelcomeBoard).toHaveBeenCalledWith(
        user.id,
        user.createdAt,
        'ru',
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
        user: { id: '1', email: dto.email, name: 'Test', avatar: undefined },
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
