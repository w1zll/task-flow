'use client';

import { authApi } from '@/shared/api/api';
import { useAuthStore } from '@/shared/store/root.store';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const AuthHydrator = () => {
  const authStore = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/auth')) {
      authStore.hydrate(null);
      return;
    }
    if (!authStore.isLoading) return;

    authApi
      .me()
      .then((res) => {
        authStore.hydrate(res.data);
      })
      .catch(() => authStore.hydrate(null));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default AuthHydrator;
