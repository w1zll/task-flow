import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ensureSocketConnected, getSocket } from '../lib/socket';
import { Board, Task } from '../api/api';
import {
  findTaskInBoard,
  moveTaskToColumnEndInBoard,
  queryKeys,
  updateTaskInBoard,
} from '../queries/boards.queries';

export const useBoardSocket = (boardId: string) => {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    let isActive = true;
    let isRefreshingAuth = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connectWithToken = async () => {
      if (isRefreshingAuth || !isActive) return;
      isRefreshingAuth = true;

      try {
        await ensureSocketConnected(socket);
      } catch (error) {
        console.error('socket auth error:', error);
        if (typeof navigator === 'undefined' || navigator.onLine !== false) {
          scheduleReconnect();
        }
      } finally {
        isRefreshingAuth = false;
      }
    };

    const scheduleReconnect = () => {
      if (!isActive) return;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        void connectWithToken();
      }, 2000);
    };

    const onConnect = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      socket.emit('board:join', { boardId });
    };

    const onConnectError = (error: Error) => {
      console.error('[WS] connect_error:', error.message);
      scheduleReconnect();
    };

    const onDisconnect = () => {
      scheduleReconnect();
    };

    const onOnline = () => {
      void connectWithToken();
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('disconnect', onDisconnect);
    window.addEventListener('online', onOnline);

    if (socket.connected) {
      socket.emit('board:join', { boardId });
    } else {
      void connectWithToken();
    }

    socket.on('board:state', (board: Board) => {
      if (board.id !== boardId) return;
      qc.setQueryData(queryKeys.board(boardId), board);
    });

    socket.on(
      'task:update',
      (
        updatedTask: Task & {
          column: {
            boardId: string;
          };
        },
      ) => {
        if (updatedTask.column.boardId !== boardId) return;
        let didCompletionChange = false;

        qc.setQueryData(queryKeys.board(boardId), (prev: Board | undefined) => {
          const currentTask = findTaskInBoard(prev, updatedTask.id);
          didCompletionChange =
            currentTask?.isCompleted !== undefined &&
            currentTask.isCompleted !== updatedTask.isCompleted;

          if (didCompletionChange && updatedTask.isCompleted) {
            return moveTaskToColumnEndInBoard(prev, updatedTask);
          }

          return updateTaskInBoard(prev, updatedTask);
        });

        if (didCompletionChange) {
          qc.invalidateQueries({
            queryKey: queryKeys.boardAnalytics(boardId),
          });
        }
      },
    );

    socket.on('task:moved', (updatedTask: Task) => {
      qc.setQueryData(queryKeys.board(boardId), (prev: Board | undefined) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns?.map((col) => ({
            ...col,
            tasks: col.tasks
              ?.filter((t) => t.id !== updatedTask.id)
              .concat(col.id === updatedTask.columnId ? [updatedTask] : [])
              .sort((a, b) => a.order - b.order),
          })),
        };
      });
    });

    socket.on(
      'task:reordered',
      ({ columnId, taskIds }: { columnId: string; taskIds: string[] }) => {
        qc.setQueryData(queryKeys.board(boardId), (prev: Board | undefined) => {
          if (!prev) return prev;
          return {
            ...prev,
            columns: prev.columns?.map((col) => {
              if (col.id !== columnId) return col;
              const sorted = taskIds.map((id) =>
                col.tasks?.find((t) => t.id === id),
              );
              return { ...col, tasks: sorted };
            }),
          };
        });
      },
    );

    return () => {
      isActive = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket.emit('board:leave', { boardId });
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('disconnect', onDisconnect);
      socket.off('board:state');
      socket.off('task:update');
      socket.off('task:moved');
      socket.off('task:reordered');
      window.removeEventListener('online', onOnline);
    };
  }, [boardId, qc]);
};
