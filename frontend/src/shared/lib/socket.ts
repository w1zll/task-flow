import { io, Socket } from 'socket.io-client';
import { authApi } from '../api/api';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';
    socket = io(`${socketUrl}/boards`, {
      withCredentials: true,
      autoConnect: false,
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
  const { data } = await authApi.wsToken();
  targetSocket.auth = { token: data.token };
};
