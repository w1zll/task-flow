'use client';

import { authApi, type RegisterPayload } from '@/shared/api/api';
import { useAuthStore } from '@/shared/store/root.store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';

export const useAuth = () => {
  const authStore = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      authApi.login(data).then((r) => r.data),
    onSuccess: ({ user }) => {
      queryClient.clear();
      authStore.setUser(user);
      router.push('/boards');
      router.refresh();
    },
    onError: (err: any) =>
      enqueueSnackbar(err.response?.data?.message || 'Login failed', {
        variant: 'error',
      }),
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterPayload) =>
      authApi.register(data).then((r) => r.data),
    onSuccess: ({ user }) => {
      queryClient.clear();
      authStore.setUser(user);
      router.push('/boards');
      router.refresh();
    },
    onError: (err: any) => {
      enqueueSnackbar(err.response?.data?.message || 'Registration failed', {
        variant: 'error',
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear();
      authStore.logout();
      router.push('/auth/login');
      router.refresh();
    },
  });

  return {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  };
};
