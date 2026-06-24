'use client';

import {
  applyPendingBoardMutation,
  isBoardPermissionError,
} from '@/shared/lib/boardSocketMutations';
import { Board, boardsApi } from '@/shared/api/api';
import { getSocket, isSocketReady } from '@/shared/lib/socket';
import { useStableBodyScrollLock } from '@/shared/lib/useStableBodyScrollLock';
import { queryKeys } from '@/shared/queries/boards.queries';
import { usePendingBoardMutationsStore } from '@/shared/store/root.store';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

const PendingBoardMutationsPrompt = () => {
  const t = useTranslations('PendingChanges');
  const mutations = usePendingBoardMutationsStore((state) => state.mutations);
  const remove = usePendingBoardMutationsStore((state) => state.remove);
  const clear = usePendingBoardMutationsStore((state) => state.clear);
  const [isSocketAvailable, setIsSocketAvailable] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const canApplyPendingChanges =
    isSocketAvailable && mutations.length > 0 && isSocketReady();
  const readOnlyMutationCount = mutations.filter(
    (mutation) =>
      qc.getQueryData<Board>(queryKeys.board(mutation.boardId))?.capabilities
        .canEditBoardContent === false,
  ).length;
  const allMutationsAreReadOnly =
    mutations.length > 0 && readOnlyMutationCount === mutations.length;

  useStableBodyScrollLock(canApplyPendingChanges);

  useEffect(() => {
    const socket = getSocket();
    const syncConnection = () => setIsSocketAvailable(isSocketReady(socket));

    syncConnection();
    socket.on('connect', syncConnection);
    socket.on('disconnect', syncConnection);
    socket.on('connect_error', syncConnection);
    window.addEventListener('online', syncConnection);
    window.addEventListener('offline', syncConnection);

    return () => {
      socket.off('connect', syncConnection);
      socket.off('disconnect', syncConnection);
      socket.off('connect_error', syncConnection);
      window.removeEventListener('online', syncConnection);
      window.removeEventListener('offline', syncConnection);
    };
  }, []);

  const invalidateBoards = (boardIds: string[]) => {
    boardIds.forEach((boardId) => {
      qc.invalidateQueries({
        queryKey: queryKeys.board(boardId),
        exact: true,
      });
      qc.invalidateQueries({
        queryKey: queryKeys.boardAnalytics(boardId),
      });
    });
  };

  const handleApply = async () => {
    setIsApplying(true);
    let appliedCount = 0;
    let deniedCount = 0;

    for (const mutation of mutations) {
      try {
        const board =
          qc.getQueryData<Board>(queryKeys.board(mutation.boardId)) ??
          (await qc.fetchQuery({
            queryKey: queryKeys.board(mutation.boardId),
            queryFn: () =>
              boardsApi.getOne(mutation.boardId).then((response) => response.data),
            staleTime: 0,
          }));
        if (!board?.capabilities.canEditBoardContent) {
          remove(mutation.id);
          deniedCount += 1;
          invalidateBoards([mutation.boardId]);
          continue;
        }

        await applyPendingBoardMutation(mutation);
        remove(mutation.id);
        appliedCount += 1;
        invalidateBoards([mutation.boardId]);
      } catch (error) {
        if (isBoardPermissionError(error)) {
          remove(mutation.id);
          deniedCount += 1;
          invalidateBoards([mutation.boardId]);
          continue;
        }
        enqueueSnackbar(t('applyError'), { variant: 'error' });
        setIsApplying(false);
        return;
      }
    }

    if (appliedCount > 0) {
      enqueueSnackbar(t('applied'), { variant: 'success' });
    }
    if (deniedCount > 0) {
      enqueueSnackbar(t('permissionChanged'), { variant: 'warning' });
    }
    setIsApplying(false);
  };

  const handleDiscard = () => {
    const boardIds = [...new Set(mutations.map((mutation) => mutation.boardId))];
    clear();
    invalidateBoards(boardIds);
    enqueueSnackbar(t('discarded'), { variant: 'info' });
  };

  return (
    <Dialog
      open={canApplyPendingChanges}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 2 } } }}
    >
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {t(
            allMutationsAreReadOnly ? 'readOnlyDescription' : 'description',
            { count: mutations.length },
          )}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleDiscard} disabled={isApplying}>
          {t('discard')}
        </Button>
        {!allMutationsAreReadOnly && (
          <Button
            variant="contained"
            onClick={handleApply}
            disabled={isApplying || !canApplyPendingChanges}
          >
            {isApplying ? t('applying') : t('apply')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PendingBoardMutationsPrompt;
