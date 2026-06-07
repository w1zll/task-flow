import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getSocket } from '../lib/socket';
import { Board, Task } from '../api/api';
import { queryKeys } from '../queries/boards.queries';

export const useBoardSocket = (boardId: string) => {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    const onConnect = () => {
      socket.emit('board:join', { boardId });
    };
    socket.on('connect', onConnect);
    socket.connect();

    if (socket.connected) {
      socket.emit('board:join', { boardId });
    }
    // socket.emit('board:join', { boardId });

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
        qc.setQueryData(queryKeys.board(boardId), (prev: Board | undefined) => {
          if (!prev) return prev;
          return {
            ...prev,
            columns: prev.columns?.map((col) => ({
              ...col,
              tasks: col.tasks?.map((t) =>
                t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
              ),
            })),
          };
        });
      },
    );

    socket.on('task:moved', (updatedTask: Task) => {
      // console.log('task moved', updatedTask);
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
        // console.log('task reordered');
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
      socket.emit('board:leave', { boardId });
      socket.off('board:state');
      socket.off('task:update');
      socket.off('task:moved');
      socket.off('task:reordered');
      // socket.disconnect();
    };
  }, [boardId, qc]);
};
