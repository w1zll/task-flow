import { JwtService } from '@nestjs/jwt';
import { WsJwtGuard } from './ws-jwt.guard';
import { ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Test, TestingModule } from '@nestjs/testing';
import { ACCESS_COOKIE } from '../auth.controller';
import { WsException } from '@nestjs/websockets';

describe('WsJwtGuard', () => {
  let guard: WsJwtGuard;
  let jwtService: JwtService;

  const mockJwtService = {
    verify: jest.fn(),
  };

  // Хелпер для создания мок-контекста с нужными куками
  const createMockContext = (
    cookie?: string,
    auth?: Record<string, unknown>,
    user?: unknown,
  ): ExecutionContext => {
    const client = {
      user,
      handshake: {
        auth: auth ?? {},
        headers: {
          cookie,
        },
      },
    } as unknown as Socket;

    return {
      switchToWs: () => ({ getClient: () => client }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsJwtGuard,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    guard = module.get<WsJwtGuard>(WsJwtGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return true and attach user to client on valid token', () => {
    const payload = { sub: '1', email: 'test@example.com' };
    mockJwtService.verify.mockReturnValue(payload);

    const context = createMockContext(`${ACCESS_COOKIE}=valid-token`);
    const client = context.switchToWs().getClient() as any;

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(client.user).toEqual(payload);
    expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token');
  });

  it('should prefer a token from Socket.IO auth payload', () => {
    const payload = { sub: '1', email: 'test@example.com' };
    mockJwtService.verify.mockReturnValue(payload);

    const context = createMockContext(`${ACCESS_COOKIE}=cookie-token`, {
      token: 'handshake-token',
    });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockJwtService.verify).toHaveBeenCalledWith('handshake-token');
  });

  it('should reuse user already attached to the socket', () => {
    const user = { sub: '1', email: 'test@example.com' };
    const context = createMockContext(undefined, undefined, user);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockJwtService.verify).not.toHaveBeenCalled();
  });

  it('should throw WsException if cookie header is missing', () => {
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(WsException);
    expect(() => guard.canActivate(context)).toThrow('Unauthorized');
  });

  it('should throw WsException if access token cookie is absent', () => {
    const context = createMockContext('other_cookie=some-value');

    expect(() => guard.canActivate(context)).toThrow(WsException);
  });

  it('should throw WsException with "Invalid token" if jwt.verify throws', () => {
    mockJwtService.verify.mockImplementation(() => {
      throw new Error();
    });
    const context = createMockContext(`${ACCESS_COOKIE}=bad-token`);

    expect(() => guard.canActivate(context)).toThrow('Invalid token');
  });
});
