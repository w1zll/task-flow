'use client';

import { useBoards } from '@/shared/queries/boards.queries';
import { useMyWorkspaceTeams } from '@/shared/queries/teams.queries';
import {
  getWorkspaceTasksFromBoards,
  useWorkspaceBoardDetails,
} from '@/shared/queries/workspace-tasks.queries';
import { useWorkspaces } from '@/shared/queries/workspaces.queries';
import { useAuthStore } from '@/shared/store/root.store';
import {
  Add,
  AssignmentTurnedInOutlined,
  Business,
  GroupsOutlined,
  OpenInNew,
  ViewKanbanOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo } from 'react';

interface Props {
  workspaceId: string;
}

const WorkspaceOverviewPage = ({ workspaceId }: Props) => {
  const t = useTranslations('WorkspaceOverview');
  const shellT = useTranslations('WorkspaceShell');
  const user = useAuthStore((state) => state.user);
  const { data: workspaces = [], isLoading: workspacesLoading } =
    useWorkspaces();
  const { data: boards = [], isLoading: boardsLoading } = useBoards();
  const myTeams = useMyWorkspaceTeams(workspaceId);
  const workspace = workspaces.find((item) => item.id === workspaceId);
  const workspaceBoards = useMemo(
    () =>
      boards
        .filter((board) => board.workspaceId === workspaceId)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() -
            new Date(a.updatedAt).getTime(),
        ),
    [boards, workspaceId],
  );
  const boardDetailQueries = useWorkspaceBoardDetails(
    workspaceId,
    workspaceBoards,
  );
  const boardDetails = boardDetailQueries
    .map((query) => query.data)
    .filter((board): board is NonNullable<typeof board> => Boolean(board));
  const myTasks = getWorkspaceTasksFromBoards(boardDetails)
    .filter(
      (task) =>
        !task.isCompleted &&
        (task.assigneeId === user?.id || task.assignee?.id === user?.id),
    )
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 5);
  const isTaskLoading = boardDetailQueries.some((query) => query.isLoading);
  const isLoading = workspacesLoading || boardsLoading;

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', mb: 3 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '6px',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Business />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" sx={{ fontWeight: 800 }} noWrap>
                {workspace?.name ?? t('loading')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('subtitle')}
              </Typography>
            </Box>
          </Stack>
          {workspace && (
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
              <Chip
                size="small"
                label={shellT(`role.${workspace.currentUserRole}`)}
              />
              {workspace.isPersonal && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={shellT('personal')}
                />
              )}
            </Stack>
          )}
        </Box>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Button
            component={Link}
            href={`/workspaces/${workspaceId}/boards`}
            variant="contained"
            startIcon={<ViewKanbanOutlined />}
          >
            {t('openBoards')}
          </Button>
          <Button
            component={Link}
            href={`/workspaces/${workspaceId}/settings`}
            variant="outlined"
          >
            {t('settings')}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            icon: <ViewKanbanOutlined />,
            label: t('boards'),
            value: workspaceBoards.length,
          },
          {
            icon: <GroupsOutlined />,
            label: t('myTeams'),
            value: myTeams.data?.length ?? 0,
          },
          {
            icon: <AssignmentTurnedInOutlined />,
            label: t('openMyTasks'),
            value: myTasks.length,
          },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Box sx={{ color: 'primary.main' }}>{item.icon}</Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {isLoading ? <Skeleton width={42} /> : item.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ justifyContent: 'space-between', mb: 2 }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t('recentBoards')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('recentBoardsDescription')}
                </Typography>
              </Box>
              <Button
                component={Link}
                href={`/workspaces/${workspaceId}/boards`}
                size="small"
                endIcon={<OpenInNew />}
              >
                {t('allBoards')}
              </Button>
            </Stack>

            {boardsLoading ? (
              <Stack spacing={1}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} variant="rounded" height={68} />
                ))}
              </Stack>
            ) : workspaceBoards.length ? (
              <Stack spacing={1}>
                {workspaceBoards.slice(0, 4).map((board) => (
                  <Card key={board.id} variant="outlined">
                    <CardActionArea
                      component={Link}
                      href={`/workspaces/${workspaceId}/boards/${board.id}`}
                      sx={{ p: 1.5 }}
                    >
                      <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{ alignItems: 'center' }}
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: board.color,
                            flexShrink: 0,
                          }}
                        />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography sx={{ fontWeight: 700 }} noWrap>
                            {board.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                          >
                            {board.description || t('noDescription')}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={shellT(`boardRole.${board.currentUserRole}`)}
                        />
                      </Stack>
                    </CardActionArea>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <Typography color="text.secondary">
                  {t('emptyBoards')}
                </Typography>
                <Button
                  component={Link}
                  href={`/workspaces/${workspaceId}/boards`}
                  startIcon={<Add />}
                  variant="contained"
                >
                  {t('createFirstBoard')}
                </Button>
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ justifyContent: 'space-between', mb: 2 }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t('myUpcomingTasks')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('myUpcomingTasksDescription')}
                </Typography>
              </Box>
              <Button
                component={Link}
                href={`/workspaces/${workspaceId}/my-tasks`}
                size="small"
                endIcon={<OpenInNew />}
              >
                {t('allTasks')}
              </Button>
            </Stack>

            {isTaskLoading ? (
              <Stack spacing={1}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} variant="rounded" height={58} />
                ))}
              </Stack>
            ) : myTasks.length ? (
              <Stack spacing={1}>
                {myTasks.map((task) => (
                  <Card key={task.id} variant="outlined">
                    <CardActionArea
                      component={Link}
                      href={`/workspaces/${workspaceId}/boards/${task.boardId}?taskId=${encodeURIComponent(task.id)}`}
                      sx={{ p: 1.5 }}
                    >
                      <Typography sx={{ fontWeight: 700 }} noWrap>
                        {task.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {task.boardTitle} · {task.columnTitle}
                        {task.dueDate
                          ? ` · ${new Date(task.dueDate).toLocaleDateString()}`
                          : ''}
                      </Typography>
                    </CardActionArea>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                {t('emptyTasks')}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WorkspaceOverviewPage;
