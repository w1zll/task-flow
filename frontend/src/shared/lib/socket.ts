import { io, Socket } from 'socket.io-client';
import { authApi } from '../api/api';

let socket: Socket | null = null;
let socketConnectPromise: Promise<Socket> | null = null;

const getSocketUrl = () =>
  (process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001').replace(
    /\/+$/,
    '',
  );

const isBrowserOffline = () =>
  typeof navigator !== 'undefined' && navigator.onLine === false;

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
  const { data } = await authApi.wsToken();
  targetSocket.auth = { token: data.token };
};

export const ensureSocketConnected = async (
  targetSocket: Socket = getSocket(),
  timeoutMs = 5000,
): Promise<Socket> => {
  if (targetSocket.connected) return targetSocket;
  if (isBrowserOffline()) {
    throw new Error('Browser is offline');
  }
  if (socketConnectPromise) return socketConnectPromise;

  socketConnectPromise = new Promise<Socket>(async (resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      targetSocket.off('connect', handleConnect);
      targetSocket.off('connect_error', handleConnectError);
    };

    const handleConnect = () => {
      cleanup();
      resolve(targetSocket);
    };

    const handleConnectError = (error: Error) => {
      cleanup();
      reject(error);
    };

    try {
      await refreshSocketAuth(targetSocket);
      if (isBrowserOffline()) {
        throw new Error('Browser is offline');
      }
      if (targetSocket.connected) {
        cleanup();
        resolve(targetSocket);
        return;
      }

      targetSocket.on('connect', handleConnect);
      targetSocket.on('connect_error', handleConnectError);
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Socket connection timeout'));
      }, timeoutMs);

      if (!targetSocket.active) {
        targetSocket.connect();
      }
    } catch (error) {
      cleanup();
      reject(error);
    }
  }).finally(() => {
    socketConnectPromise = null;
  });

  return socketConnectPromise;
};
