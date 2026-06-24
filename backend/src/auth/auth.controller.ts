import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  AuthResponseDto,
  AvatarUploadDto,
  LoginDto,
  RegisterDto,
  RegisterRequestDto,
  SessionDto,
  UserDto,
  WsTokenResponseDto,
} from './dto/auth.dto';
import type { Request, Response } from 'express';
import { User } from '@/users/entities/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { MessageDto } from '@/common/dto/message-response.dto';
import { detectRequestLocale } from '@/common/locale/request-locale';
import { FileInterceptor } from '@nestjs/platform-express';
import { avatarUploadOptions } from '@/storage/avatar-upload.constants';
import type { AvatarUploadFile } from '@/storage/storage.types';

const REFRESH_COOKIE = 'refresh_token';
export const ACCESS_COOKIE = 'access_token';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  path: '/',
};

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('avatar', avatarUploadOptions))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({ type: RegisterRequestDto })
  @ApiOperation({ summary: 'Регистрация пользователя' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  async register(
    @Body() dto: RegisterDto,
    @UploadedFile() avatarFile: AvatarUploadFile | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(
      dto,
      detectRequestLocale(req),
      avatarFile,
    );
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Авторизация пользователя' })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновление токенов' })
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    const result = await this.authService.refresh(refreshToken);
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Выход пользователя - удалиение токенов и очищение куки',
  })
  @ApiOkResponse({ type: MessageDto })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    await this.authService.logout(refreshToken);
    res.clearCookie(ACCESS_COOKIE, COOKIE_OPTIONS);
    res.clearCookie(REFRESH_COOKIE, COOKIE_OPTIONS);
    return { message: 'Выход выполнен' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение информации о текущем пользователе' })
  @ApiOkResponse({
    type: UserDto,
  })
  async me(@CurrentUser() user: User) {
    return this.toUserDto(user);
  }

  @Put('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', avatarUploadOptions))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AvatarUploadDto })
  @ApiOperation({ summary: 'Upload a new profile avatar' })
  @ApiOkResponse({ type: UserDto })
  async updateAvatar(
    @CurrentUser() user: User,
    @UploadedFile() avatarFile: AvatarUploadFile,
  ) {
    const updated = await this.authService.updateAvatar(user, avatarFile);
    return this.toUserDto(updated);
  }

  @Delete('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset profile avatar to the default' })
  @ApiOkResponse({ type: UserDto })
  async resetAvatar(@CurrentUser() user: User) {
    const updated = await this.authService.resetAvatar(user);
    return this.toUserDto(updated);
  }

  @Get('ws-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить короткоживущий токен для WebSocket' })
  @ApiOkResponse({ type: WsTokenResponseDto })
  async wsToken(@CurrentUser() user: User): Promise<WsTokenResponseDto> {
    return {
      token: this.authService.generateWebSocketToken(user),
    };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить активные сессии пользователя' })
  @ApiOkResponse({ type: SessionDto, isArray: true })
  async sessions(@CurrentUser() user: User) {
    const sessions = await this.authService.getSessions(user.id);
    return sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }));
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Завершить активную сессию' })
  async revokeSession(@Param('id') id: string, @CurrentUser() user: User) {
    await this.authService.revokeSession(user.id, id);
  }

  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie(ACCESS_COOKIE, accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    }); // 15 min
    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 d
    });
  }

  private toUserDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    };
  }
}
