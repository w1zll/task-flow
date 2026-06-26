'use client';

import { useBoards } from '@/shared/queries/boards.queries';
import {
  getWorkspaceTasksFromBoards,
  useWorkspaceBoardDetails,
} from '@/shared/queries/workspace-tasks.queries';
import { useAuthStore } from '@/shared/store/root.store';
import {
  AssignmentTurnedInOutlined,
  CheckCircleOutlined,
  Schedule,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo } from 'react';

interface Props {
  workspaceId: string;
}

const WorkspaceMyTasksPage = ({ workspaceId }: Props) => {
  const t = useTranslations('WorkspaceMyTasks');
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const { data: boards = [], isLoading: boardsLoading } = useBoards();
  const workspaceBoards = useMemo(
    () => boards.filter((board) => board.workspaceId === workspaceId),
    [boards, workspaceId],
  );
  const boardDetailQueries = useWorkspaceBoardDetails(
    workspaceId,
    workspaceBoards,
  );
  const boardDetails = boardDetailQueries
    .map((query) => query.data)
    .filter((board): board is NonNullable<typeof board> => Boolean(board));
  const tasks = getWorkspaceTasksFromBoards(boardDetails)
    .filter(
      (task) =>
        task.assigneeId === user?.id || task.assignee?.id === user?.id,
    )
    .sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  const isLoading =
    boardsLoading || boardDetailQueries.some((query) => query.isLoading);

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
      <Stack spacing={0.75} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <AssignmentTurnedInOutlined color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {t('title')}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {t('description')}
        </Typography>
      </Stack>

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        {isLoading ? (
          <Stack spacing={1.25} sx={{ p: 2 }}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={74} />
            ))}
          </Stack>
        ) : tasks.length ? (
          <Stack spacing={1.25} sx={{ p: 2 }}>
            {tasks.map((task) => {
              const isOverdue =
                Boolean(task.dueDate) &&
                !task.isCompleted &&
                new Date(task.dueDate!) < new Date();

              return (
                <Card key={task.id} variant="outlined">
                  <CardActionArea
                    component={Link}
                    href={`/workspaces/${workspaceId}/boards/${task.boardId}?taskId=${encodeURIComponent(task.id)}`}
                    sx={{ p: 2 }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      sx={{
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700 }} noWrap>
                          {task.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                        >
                          {task.boardTitle} · {task.columnTitle}
                        </Typography>
                      </Box>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}
                      >
                        {task.isCompleted ? (
                          <Chip
                            size="small"
                            icon={<CheckCircleOutlined />}
                            label={t('completed')}
                            color="success"
                            variant="outlined"
                          />
                        ) : task.dueDate ? (
                          <Chip
                            size="small"
                            icon={<Schedule />}
                            label={new Date(
                              task.dueDate,
                            ).toLocaleDateString()}
                            color={isOverdue ? 'error' : 'default'}
                            sx={
                              isOverdue
                                ? undefined
                                : {
                                    bgcolor: alpha(
                                      theme.palette.primary.main,
                                      0.1,
                                    ),
                                  }
                            }
                          />
                        ) : (
                          <Chip size="small" label={t('noDueDate')} />
                        )}
                      </Stack>
                    </Stack>
                  </CardActionArea>
                </Card>
              );
            })}
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
            <AssignmentTurnedInOutlined
              sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('emptyTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('emptyDescription')}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default WorkspaceMyTasksPage;
