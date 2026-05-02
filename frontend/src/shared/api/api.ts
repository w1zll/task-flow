import apiClient from './client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  color: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  columns?: BoardColumn[];
}

export interface BoardColumn {
  id: string;
  title: string;
  order: number;
  boardId: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  order: number;
  labels?: string[];
  dueDate?: string;
  assigneeName?: string;
  columnId: string;
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    apiClient.post<{ user: AuthUser }>('/api/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<{ user: AuthUser }>('/api/auth/login', data),

  logout: () => apiClient.post('/api/auth/logout'),

  refresh: () => apiClient.post<{ user: AuthUser }>('/api/auth/refresh'),

  me: () => apiClient.get<AuthUser>('/api/auth/me'),
};

export const boardsApi = {
  getAll: () => apiClient.get<Board[]>('/api/boards'),

  getOne: (id: string) => apiClient.get<Board>(`/api/boards/${id}`),

  create: (data: { title: string; description?: string; color?: string }) =>
    apiClient.post<Board>('/api/boards', data),

  update: (id: string, data: Partial<Board>) =>
    apiClient.patch<Board>(`/api/boards/${id}`, data),

  remove: (id: string) => apiClient.delete(`/api/boards/${id}`),
};

export const columnsApi = {
  create: (data: { title: string; boardId: string; order?: number }) =>
    apiClient.post<BoardColumn>('/api/columns', data),

  update: (id: string, data: Partial<BoardColumn>) =>
    apiClient.patch<BoardColumn>(`/api/columns/${id}`, data),

  remove: (id: string) => apiClient.delete(`/api/columns/${id}`),

  reorder: (boardId: string, columnIds: string[]) =>
    apiClient.put(`/api/columns/board/${boardId}/reorder`, { columnIds }),
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
  }) => apiClient.post<Task>('/api/tasks', data),

  update: (id: string, data: Partial<Task>) =>
    apiClient.put<Task>(`/api/tasks/${id}`, data),

  move: (id: string, data: { columnId: string; order: number }) =>
    apiClient.patch<Task>(`/api/tasks/${id}/move`, data),

  reorder: (columnId: string, taskIds: string[]) =>
    apiClient.put(`/api/tasks/column/${columnId}/reorder`, { taskIds }),

  remove: (id: string) => apiClient.delete(`/api/tasks/${id}`),
};
