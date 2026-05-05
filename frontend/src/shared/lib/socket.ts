import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('http://localhost:3001/boards', {
      withCredentials: true,
      autoConnect: false,
    });
    // socket.onAnyOutgoing((event, ...args) => {
    //   console.log('[WS OUT]', event, args);
    // });
  }

  return socket;
};
