import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  OfflineReadOnlyError,
  isBrowserOffline,
  markNetworkOffline,
  markNetworkOnline,
} from '../lib/offline';

const AUTH_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/me',
];

export const apiClient: AxiosInstance = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const method = (config.method ?? 'get').toUpperCase();
  const url = String(config.url ?? '');
  const isWriteRequest = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  const isLogout = url.includes('/api/auth/logout');

  if (isWriteRequest && !isLogout && isBrowserOffline()) {
    return Promise.reject(new OfflineReadOnlyError());
  }

  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(null);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    markNetworkOnline();
    return response;
  },
  async (error: AxiosError) => {
    if (!error.response) {
      markNetworkOffline();
    }

    const originalRequest = error.config as any;
    const url: string = originalRequest?.url ?? '';

    const isAuthEndPoint = AUTH_ENDPOINTS.some((e) => url.includes(e));
    if (isAuthEndPoint) return Promise.reject(error);

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post('/api/auth/refresh');
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/auth')
        ) {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
