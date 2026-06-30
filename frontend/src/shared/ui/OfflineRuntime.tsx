'use client';

import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import type { Board } from '@/shared/api/api';
import { markNetworkOffline, markNetworkOnline } from '@/shared/lib/offline';
import { warmOfflineNavigationRoutes } from '@/shared/lib/offline-navigation-cache';
import { queryKeys } from '@/shared/queries/board-query-keys';
import { CloudOffOutlined } from '@mui/icons-material';
import { Alert, Box } from '@mui/material';
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useSnackbar } from 'notistack';
import { useEffect, useRef } from 'react';

const canRegisterServiceWorker = () =>
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'production' &&
  'serviceWorker' in navigator &&
  window.isSecureContext;

const copy = {
  en: {
    banner: 'Offline: saved data is shown in read-only mode.',
    reconnected: 'Connection restored. Refreshing saved data.',
  },
  ru: {
    banner: 'Офлайн: показаны сохраненные данные в режиме просмотра.',
    reconnected: 'Соединение восстановлено. Обновляем сохраненные данные.',
  },
};

const OfflineRuntime = () => {
  const locale = useLocale();
  const text = locale === 'ru' ? copy.ru : copy.en;
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const wasOnlineRef = useRef(isOnline);

  useEffect(() => {
    onlineManager.setOnline(isOnline);

    if (!wasOnlineRef.current && isOnline) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards });
      enqueueSnackbar(text.reconnected, { variant: 'info' });
    }

    wasOnlineRef.current = isOnline;
  }, [enqueueSnackbar, isOnline, queryClient, text.reconnected]);

  useEffect(() => {
    if (isOnline || typeof window === 'undefined') {
      return;
    }

    let isActive = true;
    let controller: AbortController | null = null;
    let timer: number | null = null;

    const cleanupProbe = () => {
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
      controller?.abort();
      controller = null;
    };

    const probeConnection = () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        markNetworkOffline();
        return;
      }

      cleanupProbe();
      controller = new AbortController();
      timer = window.setTimeout(() => controller?.abort(), 5000);

      void fetch('/api/auth/me', {
        cache: 'no-store',
        credentials: 'include',
        signal: controller.signal,
      })
        .then(() => {
          if (isActive) markNetworkOnline();
        })
        .catch(() => {
          if (isActive) markNetworkOffline();
        })
        .finally(() => {
          if (timer) {
            window.clearTimeout(timer);
            timer = null;
          }
        });
    };

    probeConnection();
    window.addEventListener('online', probeConnection);
    window.addEventListener('focus', probeConnection);
    document.addEventListener('visibilitychange', probeConnection);
    const interval = window.setInterval(probeConnection, 5000);

    return () => {
      isActive = false;
      window.removeEventListener('online', probeConnection);
      window.removeEventListener('focus', probeConnection);
      document.removeEventListener('visibilitychange', probeConnection);
      window.clearInterval(interval);
      cleanupProbe();
    };
  }, [isOnline]);

  useEffect(() => {
    if (!isOnline || typeof window === 'undefined') return;

    let timer: number | null = null;

    const scheduleWarmNavigationCache = () => {
      if (timer) return;

      timer = window.setTimeout(() => {
        timer = null;

        const boards =
          queryClient.getQueryData<Board[]>(queryKeys.boards) ?? [];
        const routes = new Set<string>(['/workspaces']);

        if (window.location.pathname.startsWith('/workspaces')) {
          routes.add(window.location.pathname);
        }

        boards.forEach((board) => {
          const hasBoardDetails =
            queryClient.getQueryState(queryKeys.board(board.id))?.status ===
            'success';

          if (!hasBoardDetails) return;

          routes.add(`/workspaces/${board.workspaceId}`);
          routes.add(`/workspaces/${board.workspaceId}/boards`);
          routes.add(`/workspaces/${board.workspaceId}/boards/${board.id}`);
        });

        if (routes.size) {
          void warmOfflineNavigationRoutes(Array.from(routes));
        }
      }, 1500);
    };

    scheduleWarmNavigationCache();
    const unsubscribe = queryClient
      .getQueryCache()
      .subscribe(scheduleWarmNavigationCache);

    return () => {
      if (timer) window.clearTimeout(timer);
      unsubscribe();
    };
  }, [isOnline, queryClient]);

  useEffect(() => {
    if (!canRegisterServiceWorker()) return;

    const register = () => {
      void navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.warn('[PWA] Failed to register service worker', error);
      });
    };

    register();
  }, []);

  if (isOnline) return null;

  return (
    <Box
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexShrink: 0,
      }}
    >
      <Alert
        severity="warning"
        icon={<CloudOffOutlined fontSize="inherit" />}
        sx={{
          borderRadius: 0,
          alignItems: 'center',
          '& .MuiAlert-message': { width: '100%' },
        }}
      >
        {text.banner}
      </Alert>
    </Box>
  );
};

export default OfflineRuntime;
