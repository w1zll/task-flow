'use client';

import { authApi } from '@/shared/api/api';
import { useAuthStore } from '@/shared/store/root.store';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';

export const useAuth = () => {
  const authStore = useAuthStore();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      authApi.login(data).then((r) => r.data),
    onSuccess: ({ user }) => {
      console.log('success')
      authStore.setUser(user);
      router.push('/boards');
    },
    onError: (err: any) =>
      enqueueSnackbar(err.response?.data?.message || 'Login failed', {
        variant: 'error',
      }),
  });

  const registerMutation = useMutation({
    mutationFn: (data: { email: string; name: string; password: string }) =>
      authApi.register(data).then((r) => r.data),
    onSuccess: ({ user }) => {
      authStore.setUser(user);
      // console.log('to boards');
      router.push('/boards');
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
      authStore.logout();
      // console.log('to login');
      router.push('/auth/login');
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
