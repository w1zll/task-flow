import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workspacesApi } from '../api/api';
import { queryKeys } from './board-query-keys';

export const useWorkspaces = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: () => workspacesApi.getAll().then((response) => response.data),
    enabled,
    staleTime: 60_000,
  });

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      workspacesApi.create({ name }).then((response) => response.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards });
    },
  });
};

export const useSwitchWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) =>
      workspacesApi
        .switchActive(workspaceId)
        .then((response) => response.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards });
      queryClient.removeQueries({
        predicate: (query) =>
          query.queryKey[0] === 'boards' && query.queryKey.length > 1,
      });
    },
  });
};

export const useWorkspaceMembers = (workspaceId: string) =>
  useQuery({
    queryKey: queryKeys.workspaceMembers(workspaceId),
    queryFn: () =>
      workspacesApi
        .getMembers(workspaceId)
        .then((response) => response.data),
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
