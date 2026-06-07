import { io, Socket } from 'socket.io-client';
import { authApi } from '../api/api';

let socket: Socket | null = null;

const getSocketUrl = () =>
  (process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001').replace(
    /\/+$/,
    '',
  );

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl = getSocketUrl();
    socket = io(`${socketUrl}/boards`, {
      withCredentials: true,
      autoConnect: false,
      reconnection: false,
      transports: ['websocket', 'polling'],
    });
    // socket.onAnyOutgoing((event, ...args) => {
    //   console.log('[WS OUT]', event, args);
    // });
  }

  return socket;
};

export const refreshSocketAuth = async (
  targetSocket: Socket = getSocket(),
): Promise<void> => {
  const { data } = await authApi.wsToken(); // GET /api/auth/ws-token
  targetSocket.auth = { token: data.token }; // кладёт токен в handshake.auth
};
