'use client';

import {
  applyPendingBoardMutation,
} from '@/shared/lib/boardSocketMutations';
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

    for (const mutation of mutations) {
      try {
        await applyPendingBoardMutation(mutation);
        remove(mutation.id);
        invalidateBoards([mutation.boardId]);
      } catch (error) {
        enqueueSnackbar(t('applyError'), { variant: 'error' });
        setIsApplying(false);
        return;
      }
    }

    enqueueSnackbar(t('applied'), { variant: 'success' });
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
          {t('description', { count: mutations.length })}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleDiscard} disabled={isApplying}>
          {t('discard')}
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={isApplying || !canApplyPendingChanges}
        >
          {isApplying ? t('applying') : t('apply')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PendingBoardMutationsPrompt;
