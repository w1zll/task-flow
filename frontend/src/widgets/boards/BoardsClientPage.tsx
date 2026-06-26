'use client';

import { Board, Workspace } from '@/shared/api/api';
import {
  useBoards,
  useDeleteBoard,
} from '@/shared/queries/boards.queries';
import {
  Add,
  Business,
  Delete,
  MoreVert,
  ViewKanban,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';
import { useWorkspaces } from '@/shared/queries/workspaces.queries';
import BoardCreateDialog from './BoardCreateDialog';

interface Props {
  initialWorkspaces?: Workspace[];
  workspaceId?: string;
}

const BoardsClientPage = ({
  initialWorkspaces = [],
  workspaceId,
}: Props) => {
  const t = useTranslations('Boards');
  const { enqueueSnackbar } = useSnackbar();
  const { data: boards, isLoading: boardsLoading } = useBoards();
  const deleteBoard = useDeleteBoard();
  const workspaces = useWorkspaces();
  const workspaceData = workspaces.data ?? initialWorkspaces;
  const activeWorkspace = workspaceData.find(
    (workspace) => workspace.isActive,
  );
  const currentWorkspace = workspaceId
    ? workspaceData.find((workspace) => workspace.id === workspaceId)
    : undefined;
  const isWorkspaceMode = Boolean(workspaceId);
  const [createOpen, setCreateOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{
    el: HTMLElement;
    board: Board;
  } | null>(null);

  const visibleBoards = useMemo(
    () =>
      workspaceId
        ? (boards ?? []).filter((board) => board.workspaceId === workspaceId)
        : (boards ?? []),
    [boards, workspaceId],
  );

  const groupedBoards = useMemo(
    () =>
      workspaceData
        .map((workspace) => ({
          workspace,
          boards: (boards ?? []).filter(
            (board) => board.workspaceId === workspace.id,
          ),
        }))
        .filter((group) => group.boards.length > 0),
    [boards, workspaceData],
  );

  const isLoading = boardsLoading || workspaces.isLoading;

  const handleDelete = (id: string) => {
    setMenuAnchor(null);
    deleteBoard.mutate(id, {
      onSuccess: () =>
        enqueueSnackbar(t('deleteSuccess'), { variant: 'success' }),
    });
  };

  const renderBoardCard = (board: Board) => (
    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={board.id}>
      <Card
        sx={{
          height: 160,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            bgcolor: board.color,
          },
        }}
      >
        <CardActionArea
          component={Link}
          href={`/workspaces/${board.workspaceId}/boards/${board.id}`}
          sx={{
            height: '100%',
            p: 2.5,
            pt: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ width: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <Typography
                variant="h6"
                sx={{ lineHeight: 1.3, flex: 1, fontWeight: 600 }}
              >
                {board.title}
              </Typography>
              {board.capabilities.canDeleteBoard && (
                <IconButton
                  size="small"
                  sx={{ ml: 1, mt: -0.5 }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setMenuAnchor({ el: event.currentTarget, board });
                  }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              )}
            </Box>
            {board.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {board.description}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
            }}
          >
            <ViewKanban sx={{ fontSize: 16, color: board.color }} />
            <Typography variant="caption" color="text.secondary">
              {new Date(board.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </CardActionArea>
      </Card>
    </Grid>
  );

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            mb: 4,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }} noWrap>
              {isWorkspaceMode
                ? t('workspaceBoardsTitle', {
                    name: currentWorkspace?.name ?? '',
                  })
                : t('title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isWorkspaceMode
                ? t('workspaceBoardsDescription')
                : t('globalDescription')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('boardsCount', { count: visibleBoards.length })}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateOpen(true)}
            sx={{ flexShrink: 0 }}
          >
            {t('newBoard')}
          </Button>
        </Box>

        {isLoading ? (
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Skeleton variant="rounded" height={160} />
              </Grid>
            ))}
          </Grid>
        ) : isWorkspaceMode ? (
          visibleBoards.length ? (
            <Grid container spacing={2}>
              {visibleBoards.map(renderBoardCard)}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <ViewKanban
                sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('emptyWorkspaceTitle')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateOpen(true)}
                sx={{ mt: 1 }}
              >
                {t('emptyAction')}
              </Button>
            </Box>
          )
        ) : groupedBoards.length ? (
          <Stack spacing={2.5}>
            {groupedBoards.map((group) => (
              <Paper
                key={group.workspace.id}
                variant="outlined"
                sx={{ overflow: 'hidden' }}
              >
                <Box
                  sx={{
                    px: { xs: 2, sm: 3 },
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.25}
                    sx={{ alignItems: 'center', minWidth: 0 }}
                  >
                    <Business color="action" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700 }}
                        noWrap
                      >
                        {group.workspace.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {group.workspace.isPersonal
                          ? t('personalWorkspace')
                          : t(`role.${group.workspace.currentUserRole}`)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    size="small"
                    label={t('boardsCount', { count: group.boards.length })}
                  />
                </Box>
                <Divider />
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  <Grid container spacing={2}>
                    {group.boards.map(renderBoardCard)}
                  </Grid>
                </Box>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ViewKanban
              sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('emptyTitle')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateOpen(true)}
              sx={{ mt: 1 }}
            >
              {t('emptyAction')}
            </Button>
          </Box>
        )}
      </Box>

      <Menu
        open={!!menuAnchor}
        anchorEl={menuAnchor?.el}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => handleDelete(menuAnchor!.board.id)}
          sx={{ color: 'error.main' }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} /> {t('delete')}
        </MenuItem>
      </Menu>

      <BoardCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        workspaces={workspaceData}
        defaultWorkspaceId={workspaceId ?? activeWorkspace?.id}
        lockWorkspace={isWorkspaceMode}
      />
    </Box>
  );
};

export default BoardsClientPage;
