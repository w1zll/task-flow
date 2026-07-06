import { User } from '@/users/entities/user.entity';
import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { BoardsService } from '@/boards/boards.service';
import { AppLocale } from '@/common/locale/request-locale';
import { AvatarService } from '@/users/avatar.service';
import { AvatarUploadFile } from '@/storage/storage.types';
import { WorkspacesService } from '@/workspaces/workspaces.service';
import { createHmac } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,

    private readonly jwtService: JwtService,
    private readonly config: ConfigService,

    @Inject(forwardRef(() => BoardsService))
    private readonly boardsService: BoardsService,

    private readonly avatarService: AvatarService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async register(
    dto: RegisterDto,
    locale: AppLocale = 'en',
    avatarFile?: AvatarUploadFile,
  ) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }
    let user = await this.userRepo.save(this.userRepo.create(dto));

    try {
      user = await this.avatarService.initializeAvatar(user, avatarFile);
      const workspace = await this.workspacesService.createPersonalWorkspace(
        user,
        locale,
      );
      await this.boardsService.createWelcomeBoard(
        user.id,
        workspace.id,
        user.createdAt ?? new Date(),
        locale,
      );
    } catch (error) {
      await this.avatarService.removeStoredAvatar(user).catch(() => undefined);
      await this.userRepo.remove(user);
      throw error;
    }

    return this.generateTokenPair(user);
  }

  updateAvatar(user: User, avatarFile: AvatarUploadFile) {
    return this.avatarService.updateAvatar(user, avatarFile);
  }

  resetAvatar(user: User) {
    return this.avatarService.resetAvatar(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    const isMatch = await user.comparePassword(dto.password);
    if (!isMatch) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    return this.generateTokenPair(user);
  }

  async refresh(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(rawRefreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    const matchedToken = await this.findStoredRefreshToken(
      rawRefreshToken,
      payload.sub,
    );

    if (!matchedToken || matchedToken.isRevoked) {
      throw new UnauthorizedException(
        'Пользователь не авторизован. Пожалуйста, войдите заново.',
      );
    }

    if (new Date() > matchedToken.expiresAt) {
      throw new UnauthorizedException(
        'Пользователь не авторизован. Пожалуйста, войдите заново.',
      );
    }

    matchedToken.isRevoked = true;
    await this.refreshTokenRepo.save(matchedToken);

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('Пользователь не найден');

    return this.generateTokenPair(user);
  }

  async logout(rawRefreshToken: string) {
    if (!rawRefreshToken) return;

    let payload: any;
    try {
      payload = this.jwtService.verify(rawRefreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      return;
    }

    const tokenDigest = this.getRefreshTokenDigest(rawRefreshToken);
    const updateResult = await this.refreshTokenRepo.update(
      { userId: payload.sub, tokenDigest, isRevoked: false },
      { isRevoked: true },
    );

    if (updateResult.affected && updateResult.affected > 0) return;

    const storedTokens = await this.refreshTokenRepo.find({
      where: { userId: payload.sub, isRevoked: false, tokenDigest: IsNull() },
    });

    for (const t of storedTokens) {
      const isMatch = await bcrypt.compare(rawRefreshToken, t.token);
      if (isMatch) {
        t.isRevoked = true;
        await this.refreshTokenRepo.save(t);
        break;
      }
    }
  }

  async getSessions(userId: string) {
    return this.refreshTokenRepo
      .createQueryBuilder('token')
      .where('token.userId = :userId', { userId })
      .andWhere('token.isRevoked = false')
      .andWhere('token.expiresAt > NOW()')
      .orderBy('token.createdAt', 'DESC')
      .getMany();
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.refreshTokenRepo.findOne({
      where: { id: sessionId },
    });
    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Сессия не найдена');
    }
    session.isRevoked = true;
    await this.refreshTokenRepo.save(session);
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Пользователь не найден');
    return user;
  }

  generateWebSocketToken(user: User): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        tokenUse: 'websocket',
      },
      {
        expiresIn: this.config.get('JWT_WS_EXPIRES_IN') || '2m',
      },
    );
  }

  issueTokenPair(user: User) {
    return this.generateTokenPair(user);
  }

  private async generateTokenPair(user: User) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_TIME') || '7d',
    });

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    const tokenDigest = this.getRefreshTokenDigest(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        token: hashedRefresh,
        tokenDigest,
        userId: user.id,
        expiresAt,
      }),
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        activeWorkspaceId: user.activeWorkspaceId,
      },
    };
  }

  private async findStoredRefreshToken(
    rawRefreshToken: string,
    userId: string,
  ): Promise<RefreshToken | null> {
    const tokenDigest = this.getRefreshTokenDigest(rawRefreshToken);
    const tokenByDigest = await this.refreshTokenRepo.findOne({
      where: { userId, tokenDigest, isRevoked: false },
    });
    if (tokenByDigest) return tokenByDigest;

    const storedTokens = await this.refreshTokenRepo.find({
      where: { userId, isRevoked: false, tokenDigest: IsNull() },
    });

    for (const t of storedTokens) {
      const isMatch = await bcrypt.compare(rawRefreshToken, t.token);
      if (isMatch) return t;
    }

    return null;
  }

  private getRefreshTokenDigest(rawRefreshToken: string): string {
    return createHmac(
      'sha256',
      this.config.get<string>('JWT_REFRESH_SECRET') ?? '',
    )
      .update(rawRefreshToken)
      .digest('hex');
  }
}
