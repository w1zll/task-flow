'use client';

import {
  useBoard,
  useBoardDailyAnalytics,
  useBoardMembers,
  useBoardMonthlyAnalytics,
  useBoardViews,
  useCreateBoardView,
  useBoardWeeklyAnalytics,
  useCreateColumn,
  useDeleteBoardView,
  useRevokeBoardMember,
  useShareBoard,
  useTaskCompletionSummary,
  useUpdateBoardMemberRole,
} from '@/shared/queries/boards.queries';
import { Board, BoardMember } from '@/shared/api/api';
import { queryKeys } from '@/shared/queries/board-query-keys';
import { useBoardUIStore } from '@/shared/store/root.store';
import { useAuth } from '@/features/auth/useAuth';
import {
  alpha,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Add,
  ArrowBack,
  Close,
  GroupOutlined,
  LockOutlined,
  PersonAddAltOutlined,
  QueryStats,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import NextLink from 'next/link';
import { useDayjsLocale } from '@/shared/lib/useDayjsLocale';
import { useStableBodyScrollLock } from '@/shared/lib/useStableBodyScrollLock';
import KanbanBoard from './KanbanBoard';
import TaskDetailModal from './TaskDetailModal';
import { useQueryClient } from '@tanstack/react-query';
import UserAvatar from '@/shared/ui/UserAvatar';
import { useSnackbar } from 'notistack';
import { isBoardPermissionError } from '@/shared/lib/boardSocketMutations';
import { useWorkspaceMembers } from '@/shared/queries/workspaces.queries';
import { getAvailableWorkspaceMembers } from '@/shared/lib/board-members';
import {
  useMyWorkspaceTeams,
  useWorkspaceTeams,
} from '@/shared/queries/teams.queries';
import BoardFiltersToolbar from './BoardFiltersToolbar';
import {
  DEFAULT_BOARD_FILTERS,
  boardFiltersFromSavedView,
  boardFiltersToSavedView,
  countBoardTasks,
  filterBoard,
  isBoardReorderDisabledByView,
  parseBoardFiltersFromSearchParams,
  writeBoardFiltersToSearchParams,
  type BoardFilters,
} from './board-filters';

interface Props {
  boardId: string;
  initialBoard?: Board;
}

type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly';

const formatAnalyticsPeriod = (
  period: string,
  analyticsPeriod: AnalyticsPeriod,
  locale: string,
) => {
  const localizedDate = dayjs(period).locale(locale);

  if (analyticsPeriod === 'monthly') {
    return dayjs(`${period}-01`).locale(locale).format('MMM YYYY');
  }

  if (analyticsPeriod === 'weekly') {
    return `${localizedDate.format('D MMM')} - ${localizedDate
      .add(6, 'day')
      .format('D MMM')}`;
  }

  return localizedDate.format('D MMM');
};

const KanbanBoardPage = ({ boardId, initialBoard }: Props) => {
  const dayjsLocale = useDayjsLocale();
  const t = useTranslations('BoardPage');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [isInitialBoardSynced, setInitialBoardSynced] = useState(!initialBoard);
  const {
    data: queriedBoard,
    isLoading,
    isError,
  } = useBoard(boardId, initialBoard);
  const board = isInitialBoardSynced ? queriedBoard : initialBoard;
  const createColumn = useCreateColumn();
  const isAddingColumn = useBoardUIStore((state) => state.isAddingColumn);
  const closeTask = useBoardUIStore((state) => state.closeTask);
  const setAddingColumn = useBoardUIStore((state) => state.setAddingColumn);
  const setAddingTaskInColumn = useBoardUIStore(
    (state) => state.setAddingTaskInColumn,
  );
  const { user: currentUser } = useAuth();

  const [newColTitle, setNewColTitle] = useState('');
  const [isMembersOpen, setMembersOpen] = useState(false);
  const [isStatsOpen, setStatsOpen] = useState(false);
  const [shareUserId, setShareUserId] = useState('');
  const [shareRole, setShareRole] = useState<'editor' | 'viewer'>('editor');
  const [boardScrollWidth, setBoardScrollWidth] = useState(0);
  const [hasBoardHorizontalOverflow, setHasBoardHorizontalOverflow] =
    useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(
    null,
  );
  const boardScrollRef = useRef<HTMLDivElement | null>(null);
  const boardTopScrollRef = useRef<HTMLDivElement | null>(null);
  const boardContentRef = useRef<HTMLDivElement | null>(null);
  const taskToHighlightId = searchParams.get('taskId');
  const boardFilters = useMemo(
    () =>
      parseBoardFiltersFromSearchParams(
        new URLSearchParams(searchParamsString),
      ),
    [searchParamsString],
  );

  const boardMembers = useBoardMembers(boardId);
  const boardViews = useBoardViews(boardId);
  const createBoardView = useCreateBoardView();
  const deleteBoardView = useDeleteBoardView();
  const shareBoard = useShareBoard();
  const revokeMember = useRevokeBoardMember();
  const updateMemberRole = useUpdateBoardMemberRole();
  const summaryAnalytics = useTaskCompletionSummary(boardId);
  const dailyAnalytics = useBoardDailyAnalytics(boardId);
  const weeklyAnalytics = useBoardWeeklyAnalytics(boardId);
  const monthlyAnalytics = useBoardMonthlyAnalytics(boardId);
  const [analyticsPeriod, setAnalyticsPeriod] =
    useState<AnalyticsPeriod>('daily');
  const canEditBoardContent =
    board?.capabilities.canEditBoardContent ?? false;
  const canManageColumns = board?.capabilities.canManageColumns ?? false;
  const canManageBoardMembers =
    board?.capabilities.canManageBoardMembers ?? false;
  const workspaceMembers = useWorkspaceMembers(
    board?.workspaceId ?? '',
    isMembersOpen && canManageBoardMembers,
  );
  const workspaceTeams = useWorkspaceTeams(
    board?.workspaceId ?? '',
    Boolean(board?.workspaceId),
  );
  const myWorkspaceTeams = useMyWorkspaceTeams(
    board?.workspaceId ?? '',
    Boolean(board?.workspaceId),
  );
  const availableWorkspaceMembers = useMemo(
    () =>
      getAvailableWorkspaceMembers(
        workspaceMembers.data,
        boardMembers.data,
      ),
    [boardMembers.data, workspaceMembers.data],
  );
  const isShareMembersLoading =
    workspaceMembers.isLoading || boardMembers.isLoading;
  const isShareMembersError =
    workspaceMembers.isError || boardMembers.isError;
  const myTeamIds = useMemo(
    () => myWorkspaceTeams.data?.map((team) => team.id) ?? [],
    [myWorkspaceTeams.data],
  );
  const filteredBoard = useMemo(
    () =>
      board
        ? filterBoard(board, boardFilters, {
            currentUserId: currentUser?.id,
            myTeamIds,
          })
        : undefined,
    [board, boardFilters, currentUser?.id, myTeamIds],
  );
  const totalTaskCount = useMemo(() => countBoardTasks(board), [board]);
  const filteredTaskCount = useMemo(
    () => countBoardTasks(filteredBoard),
    [filteredBoard],
  );
  const isReorderDisabledByView =
    isBoardReorderDisabledByView(boardFilters);
  const selectedViewId = searchParams.get('view');

  const updateBoardFilters = useCallback(
    (filters: BoardFilters) => {
      const nextSearchParams = writeBoardFiltersToSearchParams(
        filters,
        new URLSearchParams(searchParamsString),
      );
      nextSearchParams.delete('view');
      const nextQuery = nextSearchParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParamsString],
  );

  const resetBoardFilters = useCallback(() => {
    updateBoardFilters(DEFAULT_BOARD_FILTERS);
  }, [updateBoardFilters]);

  const applySavedView = useCallback(
    (viewId: string | null) => {
      if (!viewId) {
        updateBoardFilters(DEFAULT_BOARD_FILTERS);
        return;
      }

      const view = boardViews.data?.find((item) => item.id === viewId);
      if (!view) return;

      const filters = boardFiltersFromSavedView(view.filters, view.sort);
      const nextSearchParams = writeBoardFiltersToSearchParams(
        filters,
        new URLSearchParams(searchParamsString),
      );
      nextSearchParams.set('view', viewId);
      const nextQuery = nextSearchParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [
      boardViews.data,
      pathname,
      router,
      searchParamsString,
      updateBoardFilters,
    ],
  );

  const saveCurrentView = useCallback(
    (title: string) => {
      const payload = boardFiltersToSavedView(boardFilters);
      createBoardView.mutate(
        {
          boardId,
          data: {
            title,
            filters: payload.filters,
            sort: payload.sort,
          },
        },
        {
          onSuccess: (view) => {
            enqueueSnackbar(t('filters.views.created'), {
              variant: 'success',
            });
            const nextSearchParams = writeBoardFiltersToSearchParams(
              boardFilters,
              new URLSearchParams(searchParamsString),
            );
            nextSearchParams.set('view', view.id);
            const nextQuery = nextSearchParams.toString();
            router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
              scroll: false,
            });
          },
          onError: () => {
            enqueueSnackbar(t('filters.views.createError'), {
              variant: 'error',
            });
          },
        },
      );
    },
    [
      boardFilters,
      boardId,
      createBoardView,
      enqueueSnackbar,
      pathname,
      router,
      searchParamsString,
      t,
    ],
  );

  const removeSavedView = useCallback(
    (viewId: string) => {
      deleteBoardView.mutate(
        { boardId, viewId },
        {
          onSuccess: () => {
            enqueueSnackbar(t('filters.views.deleted'), {
              variant: 'success',
            });
            if (selectedViewId === viewId) {
              updateBoardFilters(DEFAULT_BOARD_FILTERS);
            }
          },
          onError: () => {
            enqueueSnackbar(t('filters.views.deleteError'), {
              variant: 'error',
            });
          },
        },
      );
    },
    [
      boardId,
      deleteBoardView,
      enqueueSnackbar,
      selectedViewId,
      t,
      updateBoardFilters,
    ],
  );

  useStableBodyScrollLock(isMembersOpen || isStatsOpen);

  useEffect(() => {
    if (!initialBoard) return;

    qc.setQueryData(queryKeys.board(boardId), initialBoard);
    setInitialBoardSynced(true);
  }, [boardId, initialBoard, qc]);

  const todayCompletedCount = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return (
      dailyAnalytics.data?.find((item) => item.period === today)?.count ?? 0
    );
  }, [dailyAnalytics.data]);

  const chartAnalytics = {
    daily: dailyAnalytics,
    weekly: weeklyAnalytics,
    monthly: monthlyAnalytics,
  }[analyticsPeriod];

  const chartData = chartAnalytics.data ?? [];
  const isChartLoading = chartAnalytics.isLoading;
  const isChartError = chartAnalytics.isError;
  const chartXAxisLabels = useMemo(
    () =>
      chartData.map((item) =>
        formatAnalyticsPeriod(item.period, analyticsPeriod, dayjsLocale),
      ),
    [analyticsPeriod, chartData, dayjsLocale],
  );

  const analyticsPeriodLabels: Record<AnalyticsPeriod, string> = {
    daily: t('analyticsDays'),
    weekly: t('analyticsWeeks'),
    monthly: t('analyticsMonths'),
  };
  const roleLabels: Record<BoardMember['role'], string> = {
    owner: t('roleOwner'),
    editor: t('roleEditor'),
    viewer: t('roleViewer'),
  };

  useEffect(() => {
    closeTask();
    setAddingColumn(false);
    setAddingTaskInColumn(null);
  }, [boardId, closeTask, setAddingColumn, setAddingTaskInColumn]);

  useEffect(() => {
    if (!canManageColumns) setAddingColumn(false);
    if (!canEditBoardContent) setAddingTaskInColumn(null);
  }, [
    canEditBoardContent,
    canManageColumns,
    setAddingColumn,
    setAddingTaskInColumn,
  ]);

  useEffect(() => {
    const content = boardContentRef.current;
    const scrollContainer = boardScrollRef.current;
    if (!content) return;

    const updateWidth = () => {
      const nextScrollWidth = content.scrollWidth;
      setBoardScrollWidth(nextScrollWidth);
      setHasBoardHorizontalOverflow(
        scrollContainer
          ? nextScrollWidth > scrollContainer.clientWidth + 1
          : false,
      );
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(content);
    if (scrollContainer) observer.observe(scrollContainer);

    return () => observer.disconnect();
  }, [filteredBoard, isAddingColumn]);

  useEffect(() => {
    if (!taskToHighlightId || !board) return;

    setHighlightedTaskId(taskToHighlightId);

    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById(`task-${taskToHighlightId}`)
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        });
    }, 100);
    const highlightTimer = window.setTimeout(() => {
      setHighlightedTaskId((current) =>
        current === taskToHighlightId ? null : current,
      );
    }, 3000);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(highlightTimer);
    };
  }, [board, taskToHighlightId]);

  const subtleScrollbarSx: SxProps<Theme> = {
    scrollbarWidth: 'thin',
    scrollbarColor: (theme) =>
      `${alpha(theme.palette.text.primary, 0.28)} transparent`,
    '&::-webkit-scrollbar': {
      height: 8,
    },
    '&::-webkit-scrollbar-track': {
      bgcolor: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      bgcolor: (theme) => alpha(theme.palette.text.primary, 0.24),
      borderRadius: 999,
      border: '2px solid transparent',
      backgroundClip: 'content-box',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      bgcolor: (theme) => alpha(theme.palette.text.primary, 0.36),
    },
  };

  const syncBoardScroll = () => {
    if (!boardScrollRef.current || !boardTopScrollRef.current) return;
    boardTopScrollRef.current.scrollLeft = boardScrollRef.current.scrollLeft;
  };

  const syncTopScroll = () => {
    if (!boardScrollRef.current || !boardTopScrollRef.current) return;
    boardScrollRef.current.scrollLeft = boardTopScrollRef.current.scrollLeft;
  };

  const handleShareBoard = () => {
    if (!shareUserId) return;
    shareBoard.mutate(
      { boardId, userId: shareUserId, role: shareRole },
      {
        onSuccess: () => {
          setShareUserId('');
          setShareRole('editor');
          enqueueSnackbar(t('memberAdded'), { variant: 'success' });
        },
      },
    );
  };

  const handleAddColumn = () => {
    if (!canManageColumns) return;
    const title = newColTitle.trim();
    if (!title) return;
    createColumn.mutate(
      { title, boardId },
      {
        onSuccess: () => {
          setNewColTitle('');
          setAddingColumn(false);
        },
        onError: (error) => {
          if (isBoardPermissionError(error)) {
            void qc.invalidateQueries({
              queryKey: queryKeys.board(boardId),
              exact: true,
            });
          }
          enqueueSnackbar(
            t(
              isBoardPermissionError(error)
                ? 'permissionDenied'
                : 'columnCreateError',
            ),
            { variant: 'error' },
          );
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
        flex: 1,
        minHeight: 0,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: 2,
          bgcolor: 'background.paper',
          flexShrink: 0,
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
              <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
                {board?.title}
              </Typography>
            )}
            <Breadcrumbs sx={{ fontSize: 12 }}>
              <Link
                component={NextLink}
                href={
                  board?.workspaceId
                    ? `/workspaces/${board.workspaceId}/boards`
                    : '/boards'
                }
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
          {canManageColumns ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Add />}
              onClick={() => setAddingColumn(true)}
              sx={{ flexShrink: 0 }}
            >
              {t('addColumn')}
            </Button>
          ) : board && !canEditBoardContent ? (
            <Chip
              size="small"
              icon={<LockOutlined />}
              label={t('readOnly')}
              variant="outlined"
            />
          ) : null}
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant={isStatsOpen ? 'contained' : 'outlined'}
            size="small"
            startIcon={<QueryStats />}
            onClick={() => {
              setMembersOpen(false);
              setStatsOpen((open) => !open);
            }}
          >
            {t('stats')}
          </Button>
          <Button
            variant={isMembersOpen ? 'contained' : 'outlined'}
            size="small"
            startIcon={<GroupOutlined />}
            onClick={() => {
              setStatsOpen(false);
              setMembersOpen((open) => !open);
            }}
          >
            {t('members')}
          </Button>
        </Stack>
      </Box>

      {board && (
        <BoardFiltersToolbar
          filters={boardFilters}
          onChange={updateBoardFilters}
          onReset={resetBoardFilters}
          boardMembers={boardMembers.data}
          teams={workspaceTeams.data}
          filteredCount={filteredTaskCount}
          totalCount={totalTaskCount}
          isReorderDisabled={isReorderDisabledByView}
          savedViews={boardViews.data}
          selectedViewId={selectedViewId}
          isSavingView={createBoardView.isPending}
          isDeletingView={deleteBoardView.isPending}
          onApplySavedView={applySavedView}
          onSaveView={saveCurrentView}
          onDeleteSavedView={removeSavedView}
        />
      )}

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flex: 1,
              minHeight: 0,
              px: { xs: 2, sm: 3 },
              pt: 2,
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" width={280} height={400} />
            ))}
          </Box>
        ) : filteredBoard ? (
          <Box
            sx={{
              minWidth: 0,
              minHeight: 0,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Box
              ref={boardTopScrollRef}
              onScroll={syncTopScroll}
              sx={{
                ...subtleScrollbarSx,
                display: hasBoardHorizontalOverflow ? 'block' : 'none',
                overflowX: 'auto',
                overflowY: 'hidden',
                height: 14,
                flexShrink: 0,
              }}
            >
              <Box sx={{ width: boardScrollWidth, height: 1 }} />
            </Box>
            <Box
              ref={boardScrollRef}
              onScroll={syncBoardScroll}
              sx={{
                ...subtleScrollbarSx,
                flex: 1,
                minHeight: 0,
                overflowX: 'auto',
                overflowY: 'auto',
                minWidth: 0,
              }}
            >
              <Box
                ref={boardContentRef}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  width: 'max-content',
                  minWidth: '100%',
                  boxSizing: 'border-box',
                  px: { xs: 2, sm: 3 },
                  pt: 2,
                  pb: 2,
                }}
              >
                <Box sx={{ flexShrink: 0 }}>
                  <KanbanBoard
                    key={boardId}
                    board={filteredBoard}
                    highlightedTaskId={highlightedTaskId}
                    isReorderDisabled={isReorderDisabledByView}
                  />
                </Box>
                {canManageColumns && isAddingColumn ? (
                  <Box
                    sx={{
                      width: 280,
                      flexShrink: 0,
                      bgcolor: 'background.paper',
                      borderRadius: '6px',
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
          </Box>
        ) : null}
      </Box>

      <Drawer
        anchor="right"
        open={isStatsOpen}
        onClose={() => setStatsOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 360 },
              bgcolor: 'background.paper',
              borderLeft: '1px solid',
              borderColor: 'divider',
            },
          },
        }}
      >
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('stats')}
            </Typography>
            <IconButton size="small" onClick={() => setStatsOpen(false)}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
          <Box
            sx={{
              p: 2,
              bgcolor: 'background.default',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              {t('taskStats')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('onTime', { count: summaryAnalytics.data?.onTime ?? '-' })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('late', { count: summaryAnalytics.data?.late ?? '-' })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('today', { count: todayCompletedCount })}
            </Typography>
            <Tabs
              value={analyticsPeriod}
              onChange={(_, value: AnalyticsPeriod) =>
                setAnalyticsPeriod(value)
              }
              variant="fullWidth"
              sx={{ mt: 2, minHeight: 36 }}
            >
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <Tab
                  key={period}
                  value={period}
                  label={analyticsPeriodLabels[period]}
                  sx={{ minHeight: 36, py: 0.5, fontSize: 12 }}
                />
              ))}
            </Tabs>
            <Box sx={{ height: 220, mt: 1 }}>
              {isChartLoading ? (
                <Skeleton variant="rounded" width="100%" height={196} />
              ) : isChartError ? (
                <Box
                  sx={{
                    height: 196,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" color="error">
                    {t('analyticsError')}
                  </Typography>
                </Box>
              ) : chartData.length > 0 ? (
                <BarChart
                  height={196}
                  xAxis={[
                    {
                      scaleType: 'band',
                      data: chartXAxisLabels,
                      tickLabelStyle: { fontSize: 10 },
                    },
                  ]}
                  yAxis={[{ tickMinStep: 1 }]}
                  series={[
                    {
                      data: chartData.map((item) => item.count),
                      label: t('completedTasks'),
                    },
                  ]}
                  grid={{ horizontal: true }}
                  margin={{ top: 20, right: 8, bottom: 42, left: 36 }}
                  hideLegend
                />
              ) : (
                <Box
                  sx={{
                    height: 196,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t('noAnalytics')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Drawer>

      <Drawer
        anchor="right"
        open={isMembersOpen}
        onClose={() => setMembersOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 460 },
              bgcolor: 'background.paper',
              borderLeft: '1px solid',
              borderColor: 'divider',
            },
          },
        }}
      >
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('members')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('membersDescription')}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setMembersOpen(false)}>
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {canManageBoardMembers && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'background.default',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <PersonAddAltOutlined color="primary" fontSize="small" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {t('addMember')}
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                {t('shareDescription')}
              </Typography>

              <Stack spacing={1.5}>
                <FormControl size="small" fullWidth>
                  <InputLabel>{t('shareMember')}</InputLabel>
                  <Select
                    label={t('shareMember')}
                    value={shareUserId}
                    onChange={(event) => setShareUserId(event.target.value)}
                    disabled={
                      isShareMembersLoading ||
                      availableWorkspaceMembers.length === 0
                    }
                    renderValue={(value) => {
                      const selectedMember = availableWorkspaceMembers.find(
                        (member) => member.userId === value,
                      );
                      if (!selectedMember) return '';

                      return (
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: 'center' }}
                        >
                          <UserAvatar
                            name={selectedMember.user.name}
                            src={selectedMember.user.avatar}
                            size={24}
                          />
                          <Typography variant="body2" noWrap>
                            {selectedMember.user.name}
                          </Typography>
                        </Stack>
                      );
                    }}
                  >
                    {availableWorkspaceMembers.map((member) => (
                      <MenuItem key={member.userId} value={member.userId}>
                        <Stack
                          direction="row"
                          spacing={1.25}
                          sx={{ alignItems: 'center', minWidth: 0 }}
                        >
                          <UserAvatar
                            name={member.user.name}
                            src={member.user.avatar}
                            size={30}
                          />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" noWrap>
                              {member.user.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                            >
                              {member.user.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction="row" spacing={1}>
                  <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel>{t('memberRole')}</InputLabel>
                    <Select
                      label={t('memberRole')}
                      value={shareRole}
                      onChange={(event) =>
                        setShareRole(
                          event.target.value as 'editor' | 'viewer',
                        )
                      }
                    >
                      <MenuItem value="editor">{t('roleEditor')}</MenuItem>
                      <MenuItem value="viewer">{t('roleViewer')}</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    startIcon={<PersonAddAltOutlined />}
                    onClick={handleShareBoard}
                    disabled={
                      shareBoard.isPending ||
                      isShareMembersLoading ||
                      !shareUserId
                    }
                    sx={{ flex: 1 }}
                  >
                    {t('addMember')}
                  </Button>
                </Stack>
              </Stack>

              {isShareMembersLoading && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 1 }}
                >
                  {t('shareMembersLoading')}
                </Typography>
              )}
              {!isShareMembersLoading &&
                !isShareMembersError &&
                availableWorkspaceMembers.length === 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1 }}
                  >
                    {t('shareNoAvailableMembers')}
                  </Typography>
                )}
              {isShareMembersError && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ display: 'block', mt: 1 }}
                >
                  {t('shareMembersError')}
                </Typography>
              )}
              {shareBoard.isError && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ display: 'block', mt: 1 }}
                >
                  {t('shareError')}
                </Typography>
              )}
            </Box>
          )}

          <Divider />

          {boardMembers.isLoading ? (
            <Typography variant="body2" color="text.secondary">
              {t('loading')}
            </Typography>
          ) : boardMembers.data && boardMembers.data.length > 0 ? (
            <Stack spacing={1.5}>
              {[...boardMembers.data]
                .sort((memberA, memberB) => {
                  if (memberA.role === 'owner') return -1;
                  if (memberB.role === 'owner') return 1;
                  return memberA.user.name.localeCompare(memberB.user.name);
                })
                .map((member) => {
                  const { user } = member;
                  const isOwner = member.role === 'owner';
                  const isCurrentUser = user.id === currentUser?.id;

                  return (
                    <Box
                      key={user.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1.25}
                        sx={{ alignItems: 'center', minWidth: 0 }}
                      >
                        <UserAvatar
                          name={user.name}
                          src={user.avatar}
                          size={36}
                        />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" noWrap>
                            {user.name}
                            {isCurrentUser && (
                              <Typography
                                component="span"
                                variant="caption"
                                sx={{ ml: 1, color: 'primary.main' }}
                              >
                                {t('youSuffix')}
                              </Typography>
                            )}
                          </Typography>
                          <Chip
                            label={roleLabels[member.role]}
                            size="small"
                            color={isOwner ? 'primary' : 'default'}
                            variant={isOwner ? 'filled' : 'outlined'}
                            sx={{ mt: 0.5, height: 20, fontSize: 11 }}
                          />
                          <Box
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 0.5,
                              mt: 0.5,
                            }}
                          >
                            {workspaceTeams.data
                              ?.filter((team) =>
                                team.members.some(
                                  (teamMember) =>
                                    teamMember.userId === user.id,
                                ),
                              )
                              .map((team) => (
                                <Chip
                                  key={team.id}
                                  label={team.name}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    height: 20,
                                    fontSize: 10,
                                    color: team.color,
                                    borderColor: team.color,
                                  }}
                                />
                              ))}
                          </Box>
                        </Box>
                      </Stack>

                      {canManageBoardMembers && !isOwner && member.id && (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{ alignItems: 'center' }}
                        >
                          <Select
                            size="small"
                            value={member.role}
                            onChange={(event) =>
                              updateMemberRole.mutate({
                                boardId,
                                memberId: member.id!,
                                role: event.target.value as
                                  | 'editor'
                                  | 'viewer',
                              })
                            }
                            disabled={updateMemberRole.isPending}
                            aria-label={t('memberRole')}
                            sx={{ minWidth: 105, fontSize: 12 }}
                          >
                            <MenuItem value="editor">
                              {t('roleEditor')}
                            </MenuItem>
                            <MenuItem value="viewer">
                              {t('roleViewer')}
                            </MenuItem>
                          </Select>
                          <Button
                            size="small"
                            color="error"
                            disabled={revokeMember.isPending}
                            onClick={() =>
                              revokeMember.mutate({
                                boardId,
                                memberId: member.id!,
                              })
                            }
                          >
                            {t('remove')}
                          </Button>
                        </Stack>
                      )}
                    </Box>
                  );
                })}
              {(updateMemberRole.isError || revokeMember.isError) && (
                <Typography variant="caption" color="error">
                  {t('memberUpdateError')}
                </Typography>
              )}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('noMembers')}
            </Typography>
          )}
        </Box>
      </Drawer>

      {board && <TaskDetailModal board={board} />}
    </Box>
  );
};

export default KanbanBoardPage;
