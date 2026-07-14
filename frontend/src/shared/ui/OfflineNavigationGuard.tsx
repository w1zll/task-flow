'use client';

import type { Board } from '@/shared/api/api';
import { useIsOffline } from '@/shared/hooks/useOnlineStatus';
import { queryKeys } from '@/shared/queries/board-query-keys';
import { useOfflineBoardNavigationStore } from '@/shared/store/offline-board-navigation.store';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';

const BOARD_ROUTE = /^\/workspaces\/([^/]+)\/boards\/([^/]+)\/?$/;
const WORKSPACE_BOARDS_ROUTE = /^\/workspaces\/([^/]+)\/boards\/?$/;

const isModifiedClick = (event: MouseEvent) =>
  event.metaKey ||
  event.ctrlKey ||
  event.shiftKey ||
  event.altKey ||
  event.button !== 0;

const OfflineNavigationGuard = () => {
  const isOffline = useIsOffline();
  const queryClient = useQueryClient();
  const selectBoard = useOfflineBoardNavigationStore(
    (state) => state.selectBoard,
  );
  const openCatalog = useOfflineBoardNavigationStore(
    (state) => state.openCatalog,
  );
  const boardsT = useTranslations('Boards');
  const shellT = useTranslations('WorkspaceShell');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (!isOffline) return;

    const nativePushState = History.prototype.pushState;
    const nativeReplaceState = History.prototype.replaceState;
    const guardState = {
      ...(window.history.state ?? {}),
      __taskflowOfflineGuard: true,
    };
    const guardedUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    nativePushState.call(
      window.history,
      guardState,
      '',
      guardedUrl,
    );

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      nativePushState.call(
        window.history,
        guardState,
        '',
        guardedUrl,
      );
      enqueueSnackbar(shellT('offlineSectionUnavailable'), {
        variant: 'warning',
      });
    };

    window.addEventListener('popstate', handlePopState, true);

    return () => {
      window.removeEventListener('popstate', handlePopState, true);

      const currentState = window.history.state ?? {};
      if (!currentState.__taskflowOfflineGuard) return;

      const nextState = { ...currentState };
      delete nextState.__taskflowOfflineGuard;
      nativeReplaceState.call(
        window.history,
        nextState,
        '',
        window.location.href,
      );
    };
  }, [enqueueSnackbar, isOffline, shellT]);

  useEffect(() => {
    if (!isOffline) return;

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedClick(event)) return;
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const targetUrl = new URL(anchor.href, window.location.href);
      if (targetUrl.origin !== window.location.origin) return;

      event.preventDefault();

      if (targetUrl.pathname === '/workspaces') {
        openCatalog();
        return;
      }

      const workspaceBoardsMatch = targetUrl.pathname.match(
        WORKSPACE_BOARDS_ROUTE,
      );
      if (workspaceBoardsMatch) {
        openCatalog(workspaceBoardsMatch[1]);
        return;
      }

      const boardMatch = targetUrl.pathname.match(BOARD_ROUTE);
      if (boardMatch) {
        const [, workspaceId, boardId] = boardMatch;
        const board = queryClient.getQueryData<Board>(
          queryKeys.board(boardId),
        );

        if (board?.workspaceId === workspaceId) {
          selectBoard(boardId);
          return;
        }

        enqueueSnackbar(boardsT('offlineBoardUnavailable'), {
          variant: 'warning',
        });
        return;
      }

      enqueueSnackbar(shellT('offlineSectionUnavailable'), {
        variant: 'warning',
      });
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [
    boardsT,
    enqueueSnackbar,
    isOffline,
    openCatalog,
    queryClient,
    selectBoard,
    shellT,
  ]);

  return null;
};

export default OfflineNavigationGuard;
