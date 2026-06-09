import apiClient from './client';
import { ApiBody, ApiResponse } from './types';

export type AuthResponse = ApiResponse<'/api/auth/register', 'post'>;
export type AuthUser = ApiResponse<'/api/auth/me', 'get'>;
export type WsTokenResponse = { token: string };
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

  wsToken: () => apiClient.get<WsTokenResponse>('/api/auth/ws-token'),

  getSessions: () =>
    apiClient.get<ApiResponse<'/api/auth/sessions', 'get'>>(
      '/api/auth/sessions',
    ),

  revokeSession: (id: string) =>
    apiClient.delete<ApiResponse<'/api/auth/sessions/{id}', 'delete'>>(
      `/api/auth/sessions/${id}`,
    ),
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

  share: (id: string, data: ApiBody<'/api/boards/{id}/share', 'post'>) =>
    apiClient.post<ApiResponse<'/api/boards/{id}/share', 'post'>>(
      `/api/boards/${id}/share`,
      data,
    ),

  getMembers: (id: string) =>
    apiClient.get<ApiResponse<'/api/boards/{id}/members', 'get'>>(
      `/api/boards/${id}/members`,
    ),

  revokeMember: (boardId: string, memberId: string) =>
    apiClient.delete<ApiResponse<'/api/boards/{id}/share/{memberId}', 'delete'>>(
      `/api/boards/${boardId}/share/${memberId}`,
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
    assigneeId?: string;
    isCompleted?: boolean;
    completedAt?: string;
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

  analytics: {
    daily: (query?: {
      boardId?: string;
      fromDate?: string;
      toDate?: string;
    }) =>
      apiClient.get<ApiResponse<'/api/tasks/analytics/daily', 'get'>>(
        '/api/tasks/analytics/daily',
        { params: query },
      ),
    weekly: (query?: {
      boardId?: string;
      fromDate?: string;
      toDate?: string;
    }) =>
      apiClient.get<ApiResponse<'/api/tasks/analytics/weekly', 'get'>>(
        '/api/tasks/analytics/weekly',
        { params: query },
      ),
    monthly: (query?: {
      boardId?: string;
      fromDate?: string;
      toDate?: string;
    }) =>
      apiClient.get<ApiResponse<'/api/tasks/analytics/monthly', 'get'>>(
        '/api/tasks/analytics/monthly',
        { params: query },
      ),
    summary: (query?: {
      boardId?: string;
      fromDate?: string;
      toDate?: string;
    }) =>
      apiClient.get<ApiResponse<'/api/tasks/analytics/summary', 'get'>>(
        '/api/tasks/analytics/summary',
        { params: query },
      ),
  },

  remove: (id: string) =>
    apiClient.delete<ApiResponse<'/api/tasks/{id}', 'delete'>>(
      `/api/tasks/${id}`,
    ),
};
