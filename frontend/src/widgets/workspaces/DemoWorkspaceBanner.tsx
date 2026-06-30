'use client';

import { demoApi } from '@/shared/api/api';
import { useIsOffline } from '@/shared/hooks/useOnlineStatus';
import { queryKeys } from '@/shared/queries/board-query-keys';
import { useAuthStore } from '@/shared/store/root.store';
import {
  PlayArrowOutlined,
  RefreshOutlined,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

const DemoWorkspaceBanner = () => {
  const t = useTranslations('WorkspaceShell.demo');
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const { enqueueSnackbar } = useSnackbar();
  const isOffline = useIsOffline();
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const resetDialogTitleId = 'demo-reset-dialog-title';
  const resetDialogDescriptionId = 'demo-reset-dialog-description';
  const resetDemo = useMutation({
    mutationFn: () => demoApi.resetWorkspace().then((response) => response.data),
    onSuccess: ({ user, workspaceId, boardId }) => {
      setConfirmOpen(false);
      setUser(user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards });
      enqueueSnackbar(t('resetSuccess'), { variant: 'success' });
      router.push(`/workspaces/${workspaceId}/boards/${boardId}`);
      router.refresh();
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.message ?? t('resetError'), {
        variant: 'error',
      });
    },
  });

  return (
    <>
      <Box
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.warning.main, 0.1),
          px: { xs: 1, sm: 3 },
          py: { xs: 0.75, sm: 1 },
        }}
      >
        <Stack
          direction="row"
          spacing={{ xs: 0.75, sm: 1 }}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            minWidth: 0,
            overflowX: { xs: 'auto', sm: 'visible' },
            overflowY: 'hidden',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', minWidth: 0 }}
          >
            <Chip
              size="small"
              color="warning"
              icon={<PlayArrowOutlined />}
              label={t('chip')}
              sx={{ flexShrink: 0 }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: { xs: 'none', md: 'block' } }}
            >
              {t('description')}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={{ xs: 0.5, sm: 1 }}
            sx={{
              alignItems: 'center',
              flexWrap: 'nowrap',
              flexShrink: 0,
            }}
          >
          <Button
            size="small"
            color="warning"
            variant="outlined"
            startIcon={<RefreshOutlined />}
            onClick={() => setConfirmOpen(true)}
            disabled={isOffline}
            sx={{ minWidth: 'max-content', px: { xs: 1, sm: 1.25 } }}
          >
              {t('reset')}
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Dialog
        open={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby={resetDialogTitleId}
        aria-describedby={resetDialogDescriptionId}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle id={resetDialogTitleId}>{t('resetTitle')}</DialogTitle>
        <DialogContent>
          <Typography
            id={resetDialogDescriptionId}
            variant="body2"
            color="text.secondary"
          >
            {t('resetDescription')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={() => setConfirmOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            color="warning"
            variant="contained"
            onClick={() => resetDemo.mutate()}
            disabled={resetDemo.isPending || isOffline}
          >
            {resetDemo.isPending ? t('resetting') : t('resetConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DemoWorkspaceBanner;
