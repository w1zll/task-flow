'use client';

import { authApi } from '@/shared/api/api';
import { readStoredAuthUser, writeStoredAuthUser } from '@/shared/lib/auth-session';
import { isBrowserOffline } from '@/shared/lib/offline';
import { useAuthStore } from '@/shared/store/root.store';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const AuthHydrator = () => {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    let cancelled = false;

    if (pathname === '/auth' || pathname.startsWith('/auth/')) {
      hydrate(null);
      return;
    }

    const hydrateFromCache = () => {
      hydrate(readStoredAuthUser());
    };

    const loadAuthUser = async () => {
      if (isBrowserOffline()) {
        hydrateFromCache();
        return;
      }

      if (user && !isLoading) {
        return;
      }

      try {
        const res = await authApi.me();
        if (cancelled) return;
        writeStoredAuthUser(res.data);
        hydrate(res.data);
      } catch {
        if (cancelled) return;

        if (isBrowserOffline()) {
          hydrateFromCache();
          return;
        }

        hydrate(null);
      }
    };

    void loadAuthUser();

    return () => {
      cancelled = true;
    };
  }, [hydrate, isLoading, pathname, user]);

  return null;
};

export default AuthHydrator;
