'use client';

import {
  useBoard,
  useBoardDailyAnalytics,
  useBoardMembers,
  useCreateColumn,
  useRevokeBoardMember,
  useShareBoard,
  useTaskCompletionSummary,
} from '@/shared/queries/boards.queries';
import { useBoardUIStore } from '@/shared/store/root.store';
import { useAuth } from '@/features/auth/useAuth';
import {
  Box,
  Breadcrumbs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Add, ArrowBack } from '@mui/icons-material';
import NextLink from 'next/link';
import KanbanBoard from './KanbanBoard';
import TaskDetailModal from './TaskDetailModal';

interface Props {
  boardId: string;
}

const KanbanBoardPage = ({ boardId }: Props) => {
  const t = useTranslations('BoardPage');
  const router = useRouter();
  const { data: board, isLoading, isError } = useBoard(boardId);
  const createColumn = useCreateColumn();
  const isAddingColumn = useBoardUIStore((state) => state.isAddingColumn);
  const closeTask = useBoardUIStore((state) => state.closeTask);
  const setAddingColumn = useBoardUIStore((state) => state.setAddingColumn);
  const setAddingTaskInColumn = useBoardUIStore(
    (state) => state.setAddingTaskInColumn,
  );
  const { user: currentUser } = useAuth();

  const [newColTitle, setNewColTitle] = useState('');
  const [isShareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');

  const boardMembers = useBoardMembers(boardId);
  const shareBoard = useShareBoard();
  const revokeMember = useRevokeBoardMember();
  const summaryAnalytics = useTaskCompletionSummary(boardId);
  const dailyAnalytics = useBoardDailyAnalytics(boardId);

  useEffect(() => {
    closeTask();
    setAddingColumn(false);
    setAddingTaskInColumn(null);
  }, [boardId, closeTask, setAddingColumn, setAddingTaskInColumn]);

  const handleShareBoard = () => {
    if (!shareEmail.trim()) return;
    shareBoard.mutate(
      { boardId, email: shareEmail.trim() },
      {
        onSuccess: () => {
          setShareEmail('');
          setShareOpen(false);
        },
      },
    );
  };

  const handleAddColumn = () => {
    const title = newColTitle.trim();
    if (!title) return;
    createColumn.mutate(
      { title, boardId },
      {
        onSuccess: () => {
          setNewColTitle('');
          setAddingColumn(false);
        },
      },
    );
  };

  if (isError) {
    return (
      <Box sx={{ bgcolor: 'background.default' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            gap: 2,
          }}
        >
          <Typography variant="h5" color="text.secondary">
            {t('notFound')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => router.push('/boards')}
          >
            {t('backToBoards')}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}
        >
          {board && (
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor: board.color,
                flexShrink: 0,
              }}
            />
          )}
          <Box sx={{ minWidth: 0 }}>
            {isLoading ? (
              <Skeleton width={200} height={32} />
            ) : (
              <Typography variant="h6" fontWeight={700} noWrap>
                {board?.title}
              </Typography>
            )}
            <Breadcrumbs sx={{ fontSize: 12 }}>
              <Link
                component={NextLink}
                href="/boards"
                color="inherit"
                underline="hover"
                sx={{ fontSize: 12 }}
              >
                {t('boardsLink')}
              </Link>
              <Typography color="text.primary" sx={{ fontSize: 12 }}>
                {board?.title}
              </Typography>
            </Breadcrumbs>
          </Box>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShareOpen(true)}
          >
            {t('share')}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={() => setAddingColumn(true)}
          >
            {t('addColumn')}
          </Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', p: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" width={280} height={400} />
            ))}
          </Box>
        ) : board ? (
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start',
              minHeight: '100%',
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <KanbanBoard key={boardId} board={board} />
            </Box>
            <Box
              sx={{
                width: 320,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  {t('taskStats')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('onTime', { count: summaryAnalytics.data?.onTime ?? '-' })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('late', { count: summaryAnalytics.data?.late ?? '-' })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('today', { count: dailyAnalytics.data?.length ?? 0 })}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  {t('members')}
                </Typography>
                {boardMembers.isLoading ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('loading')}
                  </Typography>
                ) : boardMembers.data && boardMembers.data.length > 0 ? (
                  <Stack spacing={1}>
                    {boardMembers.data
                      .sort(({ user: userA }: any, { user: userB }: any) => {
                        // Owner is always first
                        if (userA.id === board?.ownerId) return -1;
                        if (userB.id === board?.ownerId) return 1;
                        return 0;
                      })
                      .map(({ user, id: memberId }: any) => {
                        const isOwner = user.id === board?.ownerId;
                        const isCurrentUser = user.id === currentUser?.id;
                        return (
                          <Box
                            key={user.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Typography variant="body2">
                              {user.name}
                              {isOwner && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{
                                    ml: 1,
                                    color: 'primary.main',
                                    fontWeight: 600,
                                  }}
                                >
                                  {t('ownerSuffix')}
                                </Typography>
                              )}
                              {isCurrentUser && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{
                                    ml: 1,
                                    color: 'primary.main',
                                  }}
                                >
                                  {t('youSuffix')}
                                </Typography>
                              )}
                            </Typography>
                            {currentUser?.id === board?.ownerId && !isOwner && (
                              <Button
                                size="small"
                                color="error"
                                onClick={() =>
                                  revokeMember.mutate({
                                    boardId,
                                    memberId: user.id,
                                  })
                                }
                              >
                                {t('remove')}
                              </Button>
                            )}
                          </Box>
                        );
                      })}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t('noMembers')}
                  </Typography>
                )}
              </Box>
              {isAddingColumn ? (
                <Box
                  sx={{
                    width: 280,
                    flexShrink: 0,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <TextField
                    autoFocus
                    size="small"
                    fullWidth
                    placeholder={t('columnTitle')}
                    value={newColTitle}
                    onChange={(e) => setNewColTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddColumn();
                      if (e.key === 'Escape') setAddingColumn(false);
                    }}
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleAddColumn}
                      disabled={createColumn.isPending}
                    >
                      {t('add')}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setAddingColumn(false)}
                    >
                      {t('cancel')}
                    </Button>
                  </Box>
                </Box>
              ) : null}
            </Box>
          </Box>
        ) : null}
      </Box>

      <Dialog open={isShareOpen} onClose={() => setShareOpen(false)}>
        <DialogTitle>{t('shareTitle')}</DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: 320,
            pt: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {t('shareDescription')}
          </Typography>
          <TextField
            label="Email"
            size="small"
            fullWidth
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            placeholder="user@example.com"
          />
          {shareBoard.isError && (
            <Typography variant="body2" color="error">
              {t('shareError')}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setShareOpen(false)}>{t('cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleShareBoard}
            disabled={shareBoard.isPending || !shareEmail.trim()}
          >
            {t('shareSend')}
          </Button>
        </DialogActions>
      </Dialog>

      {board && <TaskDetailModal board={board} />}
    </Box>
  );
};

export default KanbanBoardPage;
