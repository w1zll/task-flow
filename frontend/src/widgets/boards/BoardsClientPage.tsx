'use client';

import { Board } from '@/shared/api/api';
import {
  useBoards,
  useCreateBoard,
  useDeleteBoard,
} from '@/shared/queries/boards.queries';
import { useStableBodyScrollLock } from '@/shared/lib/useStableBodyScrollLock';
import {
  useSwitchWorkspace,
  useWorkspaces,
} from '@/shared/queries/workspaces.queries';
import { Add, Delete, MoreVert, ViewKanban } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  FormControl,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Skeleton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

type BoardTemplate = 'empty' | 'scrum';

const BOARD_COLORS = [
  '#6366f1',
  '#f59e0b',
  '#22c55e',
  '#ef4444',
  '#3b82f6',
  '#a855f7',
  '#14b8a6',
  '#f97316',
];

const BoardsClientPage = () => {
  const t = useTranslations('Boards');
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { data: boards, isLoading } = useBoards();
  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();
  const workspaces = useWorkspaces();
  const switchWorkspace = useSwitchWorkspace();
  const activeWorkspace = workspaces.data?.find(
    (workspace) => workspace.isActive,
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    color: BOARD_COLORS[0],
    template: 'empty' as BoardTemplate,
    workspaceId: '',
  });
  const [menuAnchor, setMenuAnchor] = useState<{
    el: HTMLElement;
    board: Board;
  } | null>(null);

  useStableBodyScrollLock(createOpen);

  const handleCreate = () => {
    if (!form.title.trim()) return;
    const workspaceId = form.workspaceId || activeWorkspace?.id;
    if (!workspaceId) return;

    createBoard.mutate({ ...form, workspaceId }, {
      onSuccess: (board) => {
        setCreateOpen(false);
        setForm({
          title: '',
          description: '',
          color: BOARD_COLORS[0],
          template: 'empty',
          workspaceId: '',
        });
        const openBoard = () => router.push(`/boards/${board.id}`);
        if (workspaceId !== activeWorkspace?.id) {
          switchWorkspace.mutate(workspaceId, {
            onSuccess: openBoard,
          });
        } else {
          openBoard();
        }
      },
    });
  };

  const openCreateDialog = () => {
    setForm((previous) => ({
      ...previous,
      workspaceId: activeWorkspace?.id ?? '',
    }));
    setCreateOpen(true);
  };

  const handleDelete = (id: string) => {
    setMenuAnchor(null);
    deleteBoard.mutate(id, {
      onSuccess: () => enqueueSnackbar(t('deleteSuccess'), { variant: 'success' }),
    });
  };

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {t('title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('boardsCount', { count: boards?.length ?? 0 })}
            </Typography>
            {activeWorkspace && (
              <Typography variant="caption" color="text.secondary">
                {t('activeWorkspace', { name: activeWorkspace.name })}
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            {t('newBoard')}
          </Button>
        </Box>

        <Grid container spacing={2}>
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                <Skeleton variant="rounded" height={160} />
              </Grid>
            ))}

          {boards?.map((board) => (
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
                  href={`/boards/${board.id}`}
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
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMenuAnchor({ el: e.currentTarget, board });
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
          ))}

          {!isLoading && boards?.length === 0 && (
            <Grid size={{ xs: 12 }}>
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
                  onClick={openCreateDialog}
                  sx={{ mt: 1 }}
                >
                  {t('emptyAction')}
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
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

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>{t('dialogTitle')}</DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            pt: '12px !important',
          }}
        >
          <TextField
            label={t('boardTitle')}
            fullWidth
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <FormControl fullWidth>
            <InputLabel>{t('workspace')}</InputLabel>
            <Select
              label={t('workspace')}
              value={form.workspaceId}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  workspaceId: event.target.value,
                }))
              }
            >
              {workspaces.data?.map((workspace) => (
                <MenuItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={t('boardDescription')}
            fullWidth
            multiline
            rows={2}
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
          />
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: 'block' }}
            >
              {t('template')}
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={form.template}
              onChange={(_, template: BoardTemplate | null) => {
                if (template) setForm((p) => ({ ...p, template }));
              }}
              aria-label={t('template')}
            >
              <ToggleButton value="empty">
                {t('templateEmpty')}
              </ToggleButton>
              <ToggleButton value="scrum">
                {t('templateScrum')}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: 'block' }}
            >
              {t('color')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {BOARD_COLORS.map((c) => (
                <Box
                  key={c}
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: c,
                    cursor: 'pointer',
                    border:
                      form.color === c ? '3px solid' : '3px solid transparent',
                    borderColor:
                      form.color === c ? 'text.primary' : 'transparent',
                    transition: 'transform 0.15s',
                    '&:hover': { transform: 'scale(1.2)' },
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>{t('cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={
              createBoard.isPending ||
              switchWorkspace.isPending ||
              !form.workspaceId
            }
          >
            {createBoard.isPending ? t('creating') : t('create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BoardsClientPage;
