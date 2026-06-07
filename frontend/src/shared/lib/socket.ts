import { io, Socket } from 'socket.io-client';

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
