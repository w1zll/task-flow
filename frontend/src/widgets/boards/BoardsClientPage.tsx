'use client';

import { Board } from '@/shared/api/api';
import {
  useBoards,
  useCreateBoard,
  useDeleteBoard,
} from '@/shared/queries/boards.queries';
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
  Menu,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

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
  const { enqueueSnackbar } = useSnackbar();
  const { data: boards, isLoading } = useBoards();
  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    color: BOARD_COLORS[0],
  });
  const [menuAnchor, setMenuAnchor] = useState<{
    el: HTMLElement;
    board: Board;
  } | null>(null);

  const handleCreate = () => {
    if (!form.title.trim()) return;
    createBoard.mutate(form, {
      onSuccess: () => {
        setCreateOpen(false);
        setForm({ title: '', description: '', color: BOARD_COLORS[0] });
      },
    });
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
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateOpen(true)}
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
                  onClick={() => setCreateOpen(true)}
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
            disabled={createBoard.isPending}
          >
            {createBoard.isPending ? t('creating') : t('create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BoardsClientPage;
