'use client';

import { authApi } from '@/shared/api/api';
import { readStoredAuthUser, writeStoredAuthUser } from '@/shared/lib/auth-session';
import {
  isBrowserOffline,
  markNetworkOffline,
} from '@/shared/lib/offline';
import { useAuthStore } from '@/shared/store/root.store';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const STARTUP_AUTH_TIMEOUT_MS = 5000;

const hasHttpResponse = (error: unknown) =>
  Boolean((error as { response?: unknown } | null)?.response);

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
        const res = await authApi.me({ timeout: STARTUP_AUTH_TIMEOUT_MS });
        if (cancelled) return;
        writeStoredAuthUser(res.data);
        hydrate(res.data);
      } catch (error) {
        if (cancelled) return;

        if (!hasHttpResponse(error)) {
          markNetworkOffline();
        }

        if (isBrowserOffline() || !hasHttpResponse(error)) {
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
