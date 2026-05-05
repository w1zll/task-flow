import apiClient from './client';
import { ApiBody, ApiResponse } from './types';

export type AuthResponse = ApiResponse<'/api/auth/register', 'post'>;
export type AuthUser = ApiResponse<'/api/auth/me', 'get'>;
export type Board = ApiResponse<'/api/boards/{id}', 'get'>;
// export type BoardColumn = NonNullable<
//   ApiResponse<'/api/boards/{id}', 'get'>['columns']
// >[number];
export type BoardColumn = Omit<
  NonNullable<Board['columns']>[number],
  'createdAt' | 'updatedAt'
>;
export type Task = ApiResponse<'/api/tasks/{id}', 'put'>;

export const authApi = {
  register: async (data: ApiBody<'/api/auth/register', 'post'>) =>
    apiClient.post<ApiResponse<'/api/auth/register', 'post'>>(
      '/api/auth/register',
      data,
    ),

  login: (data: { email: string; password: string }) =>
    apiClient.post<ApiResponse<'/api/auth/login', 'post'>>(
      '/api/auth/login',
      data,
    ),

  logout: () =>
    apiClient.post<ApiResponse<'/api/auth/logout', 'post'>>('/api/auth/logout'),

  refresh: () =>
    apiClient.post<ApiResponse<'/api/auth/refresh', 'post'>>(
      '/api/auth/refresh',
    ),

  me: () => apiClient.get<ApiResponse<'/api/auth/me', 'get'>>('/api/auth/me'),
};

export const boardsApi = {
  getAll: () => apiClient.get<ApiResponse<'/api/boards', 'get'>>('/api/boards'),

  getOne: (id: string) =>
    apiClient.get<ApiResponse<'/api/boards/{id}', 'get'>>(`/api/boards/${id}`),

  create: (data: { title: string; description?: string; color?: string }) =>
    apiClient.post<ApiResponse<'/api/boards', 'post'>>('/api/boards', data),

  update: (id: string, data: Partial<Board>) =>
    apiClient.put<ApiResponse<'/api/boards/{id}', 'put'>>(
      `/api/boards/${id}`,
      data,
    ),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<'/api/boards/{id}', 'delete'>>(
      `/api/boards/${id}`,
    ),
};

export const columnsApi = {
  create: (data: { title: string; boardId: string; order?: number }) =>
    apiClient.post<ApiResponse<'/api/columns', 'post'>>('/api/columns', data),

  update: (id: string, data: Partial<BoardColumn>) =>
    apiClient.put<ApiResponse<'/api/columns/{id}', 'put'>>(
      `/api/columns/${id}`,
      data,
    ),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<'/api/columns/{id}', 'delete'>>(
      `/api/columns/${id}`,
    ),

  reorder: (boardId: string, columnIds: string[]) =>
    apiClient.put<ApiResponse<'/api/columns/board/{boardId}/reorder', 'put'>>(
      `/api/columns/board/${boardId}/reorder`,
      { columnIds },
    ),
};

export const taskApi = {
  create: (data: {
    title: string;
    columnId: string;
    description?: string;
    priority?: Task['priority'];
    labels?: string[];
    dueDate?: string;
    assigneeName?: string;
  }) => apiClient.post<ApiResponse<'/api/tasks', 'post'>>('/api/tasks', data),

  update: (id: string, data: Partial<Task>) =>
    apiClient.put<ApiResponse<'/api/tasks/{id}', 'put'>>(
      `/api/tasks/${id}`,
      data,
    ),

  move: (id: string, data: { columnId: string; order: number }) =>
    apiClient.patch<ApiResponse<'/api/tasks/{id}/move', 'patch'>>(
      `/api/tasks/${id}/move`,
      data,
    ),

  reorder: (columnId: string, taskIds: string[]) =>
    apiClient.put<ApiResponse<'/api/tasks/column/{columnId}/reorder', 'put'>>(
      `/api/tasks/column/${columnId}/reorder`,
      { taskIds },
    ),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<'/api/tasks/{id}', 'delete'>>(
      `/api/tasks/${id}`,
    ),
};
