import { Socket } from 'socket.io-client';
import {
  ensureSocketConnected,
  getSocket,
  isSocketReady,
} from './socket';
import {
  BoardSocketEvent,
  PendingBoardMutation,
  usePendingBoardMutationsStore,
} from '../store/pending-board-mutations.store';

type SocketAckResponse = {
  ok: boolean;
  message?: string;
};

type EmitBoardSocketMutationOptions = {
  boardId: string;
  queueOnFailure?: boolean;
};

const SOCKET_ACK_TIMEOUT_MS = 5000;

export class BoardSocketMutationQueuedError extends Error {
  constructor(readonly mutation: PendingBoardMutation) {
    super('Board socket mutation queued');
    this.name = 'BoardSocketMutationQueuedError';
  }
}

class BoardSocketAckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BoardSocketAckError';
  }
}

const createMutationId = () =>
  `mutation-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const discardBufferedSocketWrites = (socket: Socket) => {
  const bufferedSocket = socket as Socket & {
    sendBuffer?: unknown[];
  };
  bufferedSocket.sendBuffer = [];
};

const queueMutation = (
  event: BoardSocketEvent,
  payload: unknown,
  boardId: string,
) => {
  const mutation: PendingBoardMutation = {
    id: createMutationId(),
    boardId,
    event,
    payload,
    createdAt: Date.now(),
  };

  usePendingBoardMutationsStore.getState().enqueue(mutation);
  return mutation;
};

const emitLiveBoardSocketMutation = async (
  event: BoardSocketEvent,
  payload: unknown,
) => {
  const socket = await ensureSocketConnected();

  if (!isSocketReady(socket)) {
    throw new Error('Socket is not ready');
  }

  await new Promise<void>((resolve, reject) => {
    socket.volatile.timeout(SOCKET_ACK_TIMEOUT_MS).emit(
      event,
      payload,
      (error: Error | null, response?: SocketAckResponse) => {
        if (error) {
          reject(error);
          return;
        }

        if (!response?.ok) {
          reject(
            new BoardSocketAckError(
              response?.message ?? 'Socket operation failed',
            ),
          );
          return;
        }

        resolve();
      },
    );
  });
};

export const emitBoardSocketMutation = async (
  event: BoardSocketEvent,
  payload: unknown,
  { boardId, queueOnFailure = true }: EmitBoardSocketMutationOptions,
) => {
  const socket = getSocket();

  if (!isSocketReady(socket)) {
    const mutation = queueMutation(event, payload, boardId);
    throw new BoardSocketMutationQueuedError(mutation);
  }

  try {
    await emitLiveBoardSocketMutation(event, payload);
  } catch (error) {
    if (error instanceof BoardSocketAckError) throw error;
    if (!queueOnFailure) throw error;

    discardBufferedSocketWrites(socket);
    socket.disconnect();

    const mutation = queueMutation(event, payload, boardId);
    throw new BoardSocketMutationQueuedError(mutation);
  }
};

export const applyPendingBoardMutation = async (
  mutation: PendingBoardMutation,
) => {
  try {
    await emitLiveBoardSocketMutation(mutation.event, mutation.payload);
  } catch (error) {
    if (!(error instanceof BoardSocketAckError)) {
      const socket = getSocket();
      discardBufferedSocketWrites(socket);
      socket.disconnect();
    }
    throw error;
  }
};

export const isBoardSocketMutationQueuedError = (
  error: unknown,
): error is BoardSocketMutationQueuedError =>
  error instanceof BoardSocketMutationQueuedError;
