import { ApiProperty, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { IsEmail, IsString, Max, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}

export class RegisterRequestDto extends RegisterDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Optional PNG, JPEG, or WebP avatar up to 2 MB',
  })
  avatar?: string;
}

export class AvatarUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'PNG, JPEG, or WebP avatar up to 2 MB',
  })
  avatar: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  avatar?: string;
}

export class AuthResponseDto {
  @ApiProperty()
  user: UserDto;
}

export class WsTokenResponseDto {
  @ApiProperty({
    description: 'Short-lived JWT used only for Socket.IO authentication',
  })
  token: string;
}

export class SessionDto {
  @ApiProperty({ example: 'session-uuid' })
  id: string;

  @ApiProperty({ example: '2026-05-05T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-12T12:00:00.000Z' })
  expiresAt: string;
}
