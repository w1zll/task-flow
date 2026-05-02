import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Board,
  BoardColumn,
  boardsApi,
  columnsApi,
  Task,
  taskApi,
} from '../api/api';

export const queryKeys = {
  boards: ['boards'] as const,
  board: (id: string) => ['boards', id] as const,
  tasks: (columnId: string) => ['tasks', columnId] as const,
};

export const useBoards = () => {
  return useQuery({
    queryKey: queryKeys.boards,
    queryFn: () => boardsApi.getAll().then((r) => r.data),
    staleTime: 60_000,
  });
};

export const useBoard = (id: string) => {
  return useQuery({
    queryKey: queryKeys.board(id),
    queryFn: () => boardsApi.getOne(id).then((r) => r.data),
    staleTime: 60_000,
    enabled: !!id,
  });
};

export const useCreateBoard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      color?: string;
    }) => boardsApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.boards }),
  });
};

export const useUpdateBoard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Board> }) =>
      boardsApi.update(id, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.boards });
      qc.invalidateQueries({ queryKey: queryKeys.board(id) });
    },
  });
};

export const useDeleteBoard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => boardsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.boards }),
  });
};

export const useCreateColumn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; boardId: string }) =>
      columnsApi.create(data).then((r) => r.data),
    onSuccess: (col) =>
      qc.invalidateQueries({ queryKey: queryKeys.board(col.boardId) }),
  });
};

export const useUpdateColumn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      boardId,
    }: {
      id: string;
      data: Partial<BoardColumn>;
      boardId: string;
    }) => columnsApi.update(id, data).then((r) => r.data),
    onSuccess: (_, { boardId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.board(boardId) }),
  });
};

export const useDeleteColumn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, boardId }: { id: string; boardId: string }) =>
      columnsApi.remove(id).then(() => boardId),
    onSuccess: (boardId) =>
      qc.invalidateQueries({ queryKey: queryKeys.board(boardId) }),
  });
};

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      columnId: string;
      boardId: string;
      description?: string;
      priority?: Task['priority'];
      labels?: string[];
    }) =>
      taskApi
        .create({
          title: data.title,
          columnId: data.columnId,
          description: data.description,
          priority: data.priority,
          labels: data.labels,
        })
        .then((r) => r.data),
    onSuccess: (_, { boardId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.board(boardId) }),
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      boardId,
    }: {
      id: string;
      data: Partial<Task>;
      boardId: string;
    }) => taskApi.update(id, data).then((r) => r.data),
    onSuccess: (_, { boardId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.board(boardId) }),
  });
};

export const useMoveTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      columnId,
      order,
      boardId,
    }: {
      id: string;
      columnId: string;
      order: number;
      boardId: string;
    }) => taskApi.move(id, { columnId, order }).then((r) => r.data),
    onSuccess: (_, { boardId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.board(boardId) }),
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, boardId }: { id: string; boardId: string }) =>
      taskApi.remove(id).then(() => boardId),
    onSuccess: (boardId) =>
      qc.invalidateQueries({ queryKey: queryKeys.board(boardId) }),
  });
};
