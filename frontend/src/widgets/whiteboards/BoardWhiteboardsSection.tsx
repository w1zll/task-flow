'use client';

import type { Board } from '@/shared/api/api';
import { useIsOffline } from '@/shared/hooks/useOnlineStatus';
import { useBoards } from '@/shared/queries/boards.queries';
import { useWorkspaceWhiteboards } from '@/shared/queries/whiteboards.queries';
import {
  Add,
  Close,
  GestureOutlined,
  LinkOutlined,
  OpenInNewOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import WhiteboardAttachDialog from './WhiteboardAttachDialog';
import WhiteboardCreateDialog from './WhiteboardCreateDialog';

interface Props {
  board: Board;
}

const BoardWhiteboardsSection = ({ board }: Props) => {
  const t = useTranslations('Whiteboards');
  const router = useRouter();
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('lg'));
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const isOffline = useIsOffline();
  const { data: boards = [] } = useBoards();
  const whiteboards = useWorkspaceWhiteboards(board.workspaceId, board.id);
  const linkedWhiteboards = whiteboards.data ?? [];
  const [createOpen, setCreateOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const canCreateOrAttach = board.capabilities.canUseWhiteboard && !isOffline;

  const openWhiteboard = (whiteboardId: string) => {
    setDrawerOpen(false);
    router.push(`/workspaces/${board.workspaceId}/whiteboards/${whiteboardId}`);
  };

  const actions = (
    <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
      <Button
        size="small"
        startIcon={<LinkOutlined />}
        disabled={!canCreateOrAttach}
        onClick={() => setAttachOpen(true)}
      >
        {t('attach')}
      </Button>
      <Button
        size="small"
        variant="contained"
        startIcon={<Add />}
        disabled={!canCreateOrAttach}
        onClick={() => setCreateOpen(true)}
      >
        {t('create')}
      </Button>
    </Stack>
  );

  return (
    <Box
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        px: { xs: 1.5, sm: 2 },
        py: 1.25,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.25}
        sx={{ alignItems: { xs: 'stretch', md: 'center' } }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', minWidth: 0, flexShrink: 0 }}
        >
          <GestureOutlined color="primary" fontSize="small" />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t('boardSectionTitle')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isCompact
                ? t('linkedCount', { count: linkedWhiteboards.length })
                : t('boardSectionDescription')}
            </Typography>
          </Box>
        </Stack>

        {isCompact ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              minWidth: 0,
              flex: 1,
            }}
          >
            <Button
              size="small"
              startIcon={<GestureOutlined />}
              onClick={() => setDrawerOpen(true)}
            >
              {t('openLinkedWhiteboards')}
            </Button>
            {actions}
          </Stack>
        ) : (
          <>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ flex: 1, minWidth: 0, flexWrap: 'wrap' }}
            >
              {linkedWhiteboards.map((whiteboard) => (
                <Chip
                  key={whiteboard.id}
                  clickable
                  color={
                    whiteboard.capabilities.canDrawWhiteboard
                      ? 'primary'
                      : 'default'
                  }
                  variant="outlined"
                  icon={<OpenInNewOutlined />}
                  label={whiteboard.title}
                  onClick={() => openWhiteboard(whiteboard.id)}
                  sx={{ maxWidth: { xs: '100%', sm: 280 } }}
                />
              ))}
              {!whiteboards.isLoading && !linkedWhiteboards.length && (
                <Typography variant="body2" color="text.secondary">
                  {t('boardSectionEmpty')}
                </Typography>
              )}
            </Stack>

            {actions}
          </>
        )}
      </Stack>

      {whiteboards.isError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {t('loadError')}
        </Alert>
      )}

      <Drawer
        anchor={isPhone ? 'bottom' : 'right'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 380 },
              maxHeight: { xs: '78dvh', sm: '100dvh' },
            },
          },
        }}
      >
        <Stack spacing={1.5} sx={{ p: 2 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('linkedDrawerTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('linkedCount', { count: linkedWhiteboards.length })}
              </Typography>
            </Box>
            <IconButton
              edge="end"
              onClick={() => setDrawerOpen(false)}
              aria-label={t('close')}
            >
              <Close />
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              size="small"
              startIcon={<LinkOutlined />}
              disabled={!canCreateOrAttach}
              onClick={() => {
                setDrawerOpen(false);
                setAttachOpen(true);
              }}
            >
              {t('attach')}
            </Button>
            <Button
              fullWidth
              size="small"
              variant="contained"
              startIcon={<Add />}
              disabled={!canCreateOrAttach}
              onClick={() => {
                setDrawerOpen(false);
                setCreateOpen(true);
              }}
            >
              {t('create')}
            </Button>
          </Stack>

          {linkedWhiteboards.length ? (
            <List disablePadding>
              {linkedWhiteboards.map((whiteboard) => (
                <ListItemButton
                  key={whiteboard.id}
                  onClick={() => openWhiteboard(whiteboard.id)}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: 38 }}>
                    <GestureOutlined sx={{ color: whiteboard.color }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={whiteboard.title}
                    secondary={
                      whiteboard.capabilities.canDrawWhiteboard
                        ? t('editable')
                        : t('readOnly')
                    }
                    slotProps={{ primary: { noWrap: true } }}
                  />
                  <OpenInNewOutlined fontSize="small" />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('boardSectionEmpty')}
            </Typography>
          )}
        </Stack>
      </Drawer>

      <WhiteboardCreateDialog
        open={createOpen}
        workspaceId={board.workspaceId}
        boards={boards}
        defaultBoardId={board.id}
        lockBoard
        onClose={() => setCreateOpen(false)}
        onCreated={(whiteboard) =>
          router.push(
            `/workspaces/${board.workspaceId}/whiteboards/${whiteboard.id}`,
          )
        }
      />
      <WhiteboardAttachDialog
        open={attachOpen}
        workspaceId={board.workspaceId}
        boardId={board.id}
        onClose={() => setAttachOpen(false)}
      />
    </Box>
  );
};

export default BoardWhiteboardsSection;
