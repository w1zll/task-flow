import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/shared/api/api';

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
