import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ACCESS_COOKIE } from '../auth.controller';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    if ((client as any).user) return true;

    const token =
      this.getHandshakeAuthToken(client) ?? this.getCookieAccessToken(client);
    console.log('WS auth token exists:', Boolean(token));
    console.log('WS namespace:', client.nsp.name);
    if (!token) throw new WsException('Unauthorized');

    try {
      const payload = this.jwtService.verify(token);
      (client as any).user = payload;
      return true;
    } catch (e) {
      throw new WsException('Invalid token');
    }
  }

  private getHandshakeAuthToken(client: Socket): string | undefined {
    const token = client.handshake.auth?.token;
    return typeof token === 'string' && token ? token : undefined;
  }

  private getCookieAccessToken(client: Socket): string | undefined {
    return client.handshake.headers.cookie
      ?.split('; ')
      .find((c) => c.startsWith(`${ACCESS_COOKIE}=`))
      ?.split('=')[1];
  }
}
