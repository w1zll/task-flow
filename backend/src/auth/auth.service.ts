import { User } from '@/users/entities/user.entity';
import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,

    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }
    const user = this.userRepo.create(dto);
    await this.userRepo.save(user);

    return this.generateTokenPair(user);
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

    const hashed = await bcrypt.hash(rawRefreshToken, 10);

    const storedToken = await this.refreshTokenRepo.find({
      where: { userId: payload.sub, isRevoked: false },
    });

    let matchedToken: RefreshToken | null = null;
    for (const t of storedToken) {
      const isMatch = await bcrypt.compare(rawRefreshToken, t.token);
      if (isMatch) {
        matchedToken = t;
        break;
      }
    }

    if (!matchedToken || matchedToken.isRevoked) {
      await this.refreshTokenRepo.update(
        { userId: payload.sub },
        { isRevoked: true },
      );
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

    const storedTokens = await this.refreshTokenRepo.find({
      where: { isRevoked: false },
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
    const session = await this.refreshTokenRepo.findOne({ where: { id: sessionId } });
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

  private async generateTokenPair(user: User) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_TIME') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_TIME') || '7d',
    });

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        token: hashedRefresh,
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
      },
    };
  }
}
