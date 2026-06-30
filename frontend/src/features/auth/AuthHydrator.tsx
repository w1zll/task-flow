'use client';

import { authApi } from '@/shared/api/api';
import { readStoredAuthUser, writeStoredAuthUser } from '@/shared/lib/auth-session';
import { isBrowserOffline } from '@/shared/lib/offline';
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

    if (isBrowserOffline()) {
      authStore.hydrate(readStoredAuthUser());
      return;
    }

    authApi
      .me()
      .then((res) => {
        writeStoredAuthUser(res.data);
        authStore.hydrate(res.data);
      })
      .catch(() => {
        if (isBrowserOffline()) {
          authStore.hydrate(readStoredAuthUser());
          return;
        }

        authStore.hydrate(null);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default AuthHydrator;
