import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/shared/api/api';
import { useAuthStore } from '@/shared/store/root.store';
import { queryKeys } from './board-query-keys';

export const authQueryKeys = {
  sessions: ['auth', 'sessions'] as const,
};

export const useSessions = () => {
  return useQuery({
    queryKey: authQueryKeys.sessions,
    queryFn: () => authApi.getSessions().then((r) => r.data),
    staleTime: 60_000,
  });
};

export const useRevokeSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authApi.revokeSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: authQueryKeys.sessions }),
  });
};

export const useUpdateAvatar = () => {
  const qc = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (file: File) => authApi.updateAvatar(file).then((r) => r.data),
    onSuccess: (user) => {
      setUser(user);
      void qc.invalidateQueries({ queryKey: queryKeys.boards });
    },
  });
};

export const useResetAvatar = () => {
  const qc = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: () => authApi.resetAvatar().then((r) => r.data),
    onSuccess: (user) => {
      setUser(user);
      void qc.invalidateQueries({ queryKey: queryKeys.boards });
    },
  });
};
