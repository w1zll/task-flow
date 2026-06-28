'use client';

import { demoApi, Workspace } from '@/shared/api/api';
import { queryKeys } from '@/shared/queries/board-query-keys';
import { useAuthStore } from '@/shared/store/root.store';
import {
  PlayArrowOutlined,
  RefreshOutlined,
  TaskAltOutlined,
  WarningAmberOutlined,
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
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

interface Props {
  workspace: Workspace;
  startBoardId?: string;
}

const DemoWorkspaceBanner = ({ workspace, startBoardId }: Props) => {
  const t = useTranslations('WorkspaceShell.demo');
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const { enqueueSnackbar } = useSnackbar();
  const [isConfirmOpen, setConfirmOpen] = useState(false);
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

  const boardHref = startBoardId
    ? `/workspaces/${workspace.id}/boards/${startBoardId}`
    : `/workspaces/${workspace.id}/boards`;

  return (
    <>
      <Box
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.warning.main, 0.1),
          px: { xs: 2, sm: 3 },
          py: 1,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            minWidth: 0,
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
              noWrap
            >
              {t('description')}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              flexWrap: 'wrap',
              rowGap: 1,
            }}
          >
            <Button
              size="small"
              component={NextLink}
              href={`/workspaces/${workspace.id}/my-tasks`}
              startIcon={<TaskAltOutlined />}
            >
              {t('myTasks')}
            </Button>
            <Button
              size="small"
              component={NextLink}
              href={`${boardHref}?status=overdue&sort=dueDate`}
              startIcon={<WarningAmberOutlined />}
            >
              {t('overdue')}
            </Button>
            <Button
              size="small"
              color="warning"
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => setConfirmOpen(true)}
            >
              {t('reset')}
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Dialog
        open={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t('resetTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t('resetDescription')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            color="warning"
            variant="contained"
            onClick={() => resetDemo.mutate()}
            disabled={resetDemo.isPending}
          >
            {resetDemo.isPending ? t('resetting') : t('resetConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DemoWorkspaceBanner;
