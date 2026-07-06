'use client';

import { useBoards } from '@/shared/queries/boards.queries';
import { useWorkspaceAnalyticsDashboard } from '@/shared/queries/workspace-analytics.queries';
import { useWorkspaceTeams } from '@/shared/queries/teams.queries';
import { useWorkspaceMembers } from '@/shared/queries/workspaces.queries';
import {
  AccessTimeOutlined,
  AssignmentLateOutlined,
  DoneAllOutlined,
  GroupsOutlined,
  QueryStatsOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import dayjs from 'dayjs';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import type { ReactNode } from 'react';

const DATE_FORMAT = 'YYYY-MM-DD';

type FilterPatch = {
  boardId?: string | null;
  teamId?: string | null;
  assigneeId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
};

type AnalyticsFilters = {
  boardId: string | null;
  teamId: string | null;
  assigneeId: string | null;
  fromDate: string;
  toDate: string;
};

const EMPTY_ANALYTICS_FILTERS: AnalyticsFilters = {
  boardId: null,
  teamId: null,
  assigneeId: null,
  fromDate: '',
  toDate: '',
};

interface Props {
  workspaceId: string;
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper: string;
  tone?: 'default' | 'warning' | 'success';
  isLoading: boolean;
}

const StatCard = ({
  icon,
  label,
  value,
  helper,
  tone = 'default',
  isLoading,
}: StatCardProps) => {
  const theme = useTheme();
  const color =
    tone === 'warning'
      ? theme.palette.warning.main
      : tone === 'success'
        ? theme.palette.success.main
        : theme.palette.primary.main;

  return (
    <Paper
      variant="outlined"
      sx={{
        height: '100%',
        minWidth: 0,
        p: { xs: 1.75, sm: 2 },
        borderRadius: '8px',
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '8px',
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            color,
            bgcolor: alpha(color, 0.12),
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" sx={{ mt: 0.25, fontWeight: 800 }}>
            {isLoading ? <Skeleton width={56} /> : value}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', overflowWrap: 'anywhere' }}
          >
            {isLoading ? <Skeleton width={130} /> : helper}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

interface ChartPanelProps {
  title: string;
  description: string;
  isLoading: boolean;
  isEmpty: boolean;
  emptyText: string;
  children: ReactNode;
}

const ChartPanel = ({
  title,
  description,
  isLoading,
  isEmpty,
  emptyText,
  children,
}: ChartPanelProps) => (
  <Paper
    variant="outlined"
    sx={{ height: '100%', minWidth: 0, p: { xs: 1.75, sm: 2 }, borderRadius: '8px' }}
  >
    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
      {title}
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mt: 0.25, mb: 1.5, overflowWrap: 'anywhere' }}
    >
      {description}
    </Typography>
    {isLoading ? (
      <Skeleton variant="rounded" height={250} />
    ) : isEmpty ? (
      <Box
        sx={{
          height: 250,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          px: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {emptyText}
        </Typography>
      </Box>
    ) : (
      <Box sx={{ minWidth: 0, height: 270 }}>{children}</Box>
    )}
  </Paper>
);

const WorkspaceAnalyticsPage = ({ workspaceId }: Props) => {
  const t = useTranslations('WorkspaceAnalytics');
  const locale = useLocale();
  const pathname = usePathname();
  const applyFiltersFrameRef = useRef<number | null>(null);
  const [isFilterTransitionPending, startFilterTransition] = useTransition();

  const createDefaultFilters = useCallback((): AnalyticsFilters => {
    const today = dayjs();

    return {
      boardId: null,
      teamId: null,
      assigneeId: null,
      fromDate: today.subtract(90, 'day').format(DATE_FORMAT),
      toDate: today.format(DATE_FORMAT),
    };
  }, []);

  const readFiltersFromLocation = useCallback((): AnalyticsFilters => {
    if (typeof window === 'undefined') return createDefaultFilters();

    const params = new URLSearchParams(window.location.search);
    const defaults = createDefaultFilters();

    return {
      boardId: params.get('boardId') || null,
      teamId: params.get('teamId') || null,
      assigneeId: params.get('assigneeId') || null,
      fromDate: params.get('fromDate') || defaults.fromDate,
      toDate: params.get('toDate') || defaults.toDate,
    };
  }, [createDefaultFilters]);

  const [filters, setFilters] =
    useState<AnalyticsFilters>(EMPTY_ANALYTICS_FILTERS);
  const [queryFilters, setQueryFilters] =
    useState<AnalyticsFilters>(EMPTY_ANALYTICS_FILTERS);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const initialFilters = readFiltersFromLocation();
    setFilters(initialFilters);
    setQueryFilters(initialFilters);
    setHasHydrated(true);
  }, [readFiltersFromLocation]);

  useEffect(
    () => () => {
      if (applyFiltersFrameRef.current !== null) {
        window.cancelAnimationFrame(applyFiltersFrameRef.current);
      }
    },
    [],
  );

  const { data: boards = [], isLoading: isBoardsLoading } = useBoards();
  const teams = useWorkspaceTeams(workspaceId);
  const members = useWorkspaceMembers(workspaceId);
  const analytics = useWorkspaceAnalyticsDashboard(
    workspaceId,
    queryFilters,
    hasHydrated,
  );
  const data = hasHydrated ? analytics.data : undefined;
  const isInitialLoading = !hasHydrated || (analytics.isLoading && !data);
  const filterKey = JSON.stringify(filters);
  const queryFilterKey = JSON.stringify(queryFilters);
  const hasPendingFilterApply =
    hasHydrated && (filterKey !== queryFilterKey || isFilterTransitionPending);
  const isRefreshing =
    hasHydrated &&
    Boolean(data) &&
    (hasPendingFilterApply || analytics.isFetching);

  const workspaceBoards = useMemo(
    () =>
      hasHydrated
        ? boards
            .filter((board) => board.workspaceId === workspaceId)
            .sort((a, b) => a.title.localeCompare(b.title))
        : [],
    [boards, hasHydrated, workspaceId],
  );
  const teamOptions = hasHydrated ? (teams.data ?? []) : [];
  const memberOptions = hasHydrated ? (members.data ?? []) : [];
  const displayedBurndownBoardId = data?.burndown?.boardId ?? null;
  const selectedBoard = workspaceBoards.find(
    (board) => board.id === displayedBurndownBoardId,
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
      }),
    [locale],
  );
  const formatDate = (value: string) => dateFormatter.format(new Date(value));
  const formatHours = (minutes: number) =>
    minutes > 0 ? t('hours', { count: Math.round(minutes / 60) }) : '0';
  const formatRatio = (ratio: number | null | undefined) =>
    ratio === null || ratio === undefined
      ? t('notAvailable')
      : `${Math.round(ratio * 100)}%`;

  const replaceUrlFilters = useCallback(
    (nextFilters: AnalyticsFilters) => {
      const next = new URLSearchParams(window.location.search);
      (
        [
          'boardId',
          'teamId',
          'assigneeId',
          'fromDate',
          'toDate',
        ] as const
      ).forEach((key) => {
        const value = nextFilters[key];
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
      });
      const query = next.toString();
      window.history.replaceState(
        null,
        '',
        query ? `${pathname}?${query}` : pathname,
      );
    },
    [pathname],
  );

  const scheduleFilterApply = useCallback(
    (nextFilters: AnalyticsFilters, updateUrl: () => void) => {
      if (applyFiltersFrameRef.current !== null) {
        window.cancelAnimationFrame(applyFiltersFrameRef.current);
      }

      applyFiltersFrameRef.current = window.requestAnimationFrame(() => {
        applyFiltersFrameRef.current = window.requestAnimationFrame(() => {
          applyFiltersFrameRef.current = null;
          updateUrl();
          startFilterTransition(() => setQueryFilters(nextFilters));
        });
      });
    },
    [startFilterTransition],
  );

  const updateFilters = (patch: FilterPatch) => {
    const nextFilters = {
      ...filters,
      ...patch,
      fromDate: patch.fromDate ?? filters.fromDate,
      toDate: patch.toDate ?? filters.toDate,
    };
    setFilters(nextFilters);
    scheduleFilterApply(nextFilters, () => replaceUrlFilters(nextFilters));
  };

  const resetFilters = () => {
    const nextFilters = createDefaultFilters();
    setFilters(nextFilters);
    scheduleFilterApply(nextFilters, () =>
      window.history.replaceState(null, '', pathname),
    );
  };

  const completedByTeam = data?.completedByTeam ?? [];
  const workload = data?.workloadByAssignee ?? [];
  const throughput = data?.throughputByWeek ?? [];
  const burndownSeries =
    data?.burndown?.hasStoryPoints
      ? data.burndown.remainingStoryPoints
      : data?.burndown?.remainingTasks;
  const hasNoData = Boolean(data) && data!.totals.total === 0;
  const completedByTeamChart = useMemo(
    () => (
      <BarChart
        height={260}
        xAxis={[
          {
            scaleType: 'band',
            data: completedByTeam.map(
              (item) => item.name ?? t('unassignedTeam'),
            ),
            tickLabelStyle: { fontSize: 11 },
          },
        ]}
        yAxis={[{ tickMinStep: 1 }]}
        series={[
          {
            data: completedByTeam.map((item) => item.count),
            label: t('charts.completedSeries'),
          },
        ]}
        grid={{ horizontal: true }}
        margin={{ top: 24, right: 16, bottom: 56, left: 40 }}
        hideLegend
      />
    ),
    [completedByTeam, t],
  );
  const workloadChart = useMemo(
    () => (
      <BarChart
        height={260}
        xAxis={[
          {
            scaleType: 'band',
            data: workload.map(
              (item) => item.name ?? t('unassignedAssignee'),
            ),
            tickLabelStyle: { fontSize: 11 },
          },
        ]}
        yAxis={[{ tickMinStep: 1 }]}
        series={[
          {
            data: workload.map((item) => item.openCount),
            label: t('charts.openSeries'),
          },
          {
            data: workload.map((item) => item.overdueCount),
            label: t('charts.overdueSeries'),
          },
        ]}
        grid={{ horizontal: true }}
        margin={{ top: 24, right: 16, bottom: 56, left: 40 }}
      />
    ),
    [t, workload],
  );
  const throughputChart = useMemo(
    () => (
      <BarChart
        height={260}
        xAxis={[
          {
            scaleType: 'band',
            data: throughput.map((item) =>
              dateFormatter.format(new Date(item.weekStart)),
            ),
            tickLabelStyle: { fontSize: 11 },
          },
        ]}
        yAxis={[{ tickMinStep: 1 }]}
        series={[
          {
            data: throughput.map((item) => item.count),
            label: t('charts.completedSeries'),
          },
        ]}
        grid={{ horizontal: true }}
        margin={{ top: 24, right: 16, bottom: 56, left: 40 }}
        hideLegend
      />
    ),
    [dateFormatter, t, throughput],
  );
  const burndownChart = useMemo(
    () => (
      <LineChart
        height={260}
        xAxis={[
          {
            scaleType: 'point',
            data: burndownSeries?.map((item) =>
              dateFormatter.format(new Date(item.weekStart)),
            ),
            tickLabelStyle: { fontSize: 11 },
          },
        ]}
        yAxis={[{ tickMinStep: 1 }]}
        series={[
          {
            data: burndownSeries?.map((item) => item.count) ?? [],
            label: data?.burndown?.hasStoryPoints
              ? t('charts.remainingStoryPoints')
              : t('charts.remainingTasks'),
          },
        ]}
        grid={{ horizontal: true }}
        margin={{ top: 24, right: 16, bottom: 56, left: 40 }}
      />
    ),
    [burndownSeries, data?.burndown?.hasStoryPoints, dateFormatter, t],
  );

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1180,
        minWidth: 0,
        boxSizing: 'border-box',
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        py: { xs: 2.5, sm: 4 },
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 2.5, justifyContent: 'space-between', minWidth: 0 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <QueryStatsOutlined color="primary" />
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '1.5rem', sm: '2.125rem' },
                fontWeight: 800,
                lineHeight: 1.2,
                overflowWrap: 'anywhere',
              }}
            >
              {t('title')}
            </Typography>
          </Stack>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.75, overflowWrap: 'anywhere' }}
          >
            {t('description')}
          </Typography>
        </Box>
        {isRefreshing && (
          <Chip
            color="primary"
            variant="outlined"
            label={t('updating')}
            sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
          />
        )}
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          mb: 2.5,
          overflow: 'hidden',
          borderRadius: '8px',
        }}
      >
        {isRefreshing && <LinearProgress />}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            flexWrap: 'wrap',
            gap: 1.5,
            p: { xs: 1.5, sm: 2 },
            alignItems: { sm: 'center' },
          }}
        >
          <TextField
            select
            size="small"
            label={t('filters.board')}
            value={filters.boardId ?? ''}
            disabled={!hasHydrated || isBoardsLoading}
            onChange={(event) =>
              updateFilters({ boardId: event.target.value || null })
            }
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 220px', md: '1 1 190px' },
              minWidth: { xs: '100%', sm: 180 },
            }}
          >
            <MenuItem value="">{t('filters.allBoards')}</MenuItem>
            {workspaceBoards.map((board) => (
              <MenuItem key={board.id} value={board.id}>
                {board.title}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label={t('filters.team')}
            value={filters.teamId ?? ''}
            disabled={!hasHydrated || teams.isLoading}
            onChange={(event) =>
              updateFilters({ teamId: event.target.value || null })
            }
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 180px', md: '1 1 170px' },
              minWidth: { xs: '100%', sm: 160 },
            }}
          >
            <MenuItem value="">{t('filters.allTeams')}</MenuItem>
            {teamOptions.map((team) => (
              <MenuItem key={team.id} value={team.id}>
                {team.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label={t('filters.assignee')}
            value={filters.assigneeId ?? ''}
            disabled={!hasHydrated || members.isLoading}
            onChange={(event) =>
              updateFilters({ assigneeId: event.target.value || null })
            }
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 220px', md: '1 1 190px' },
              minWidth: { xs: '100%', sm: 180 },
            }}
          >
            <MenuItem value="">{t('filters.allAssignees')}</MenuItem>
            {memberOptions.map((member) => (
              <MenuItem key={member.userId} value={member.userId}>
                {member.user.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            type="date"
            label={t('filters.from')}
            value={filters.fromDate}
            disabled={!hasHydrated}
            onChange={(event) => updateFilters({ fromDate: event.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 150px' },
              minWidth: { xs: '100%', sm: 145 },
            }}
          />
          <TextField
            size="small"
            type="date"
            label={t('filters.to')}
            value={filters.toDate}
            disabled={!hasHydrated}
            onChange={(event) => updateFilters({ toDate: event.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 150px' },
              minWidth: { xs: '100%', sm: 145 },
            }}
          />
          <Button
            variant="text"
            onClick={resetFilters}
            disabled={!hasHydrated}
            sx={{
              alignSelf: { xs: 'stretch', sm: 'center' },
              minHeight: 40,
              flexShrink: 0,
            }}
          >
            {t('filters.reset')}
          </Button>
        </Box>
      </Paper>

      {analytics.isError && !data && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {t('loadError')}
        </Alert>
      )}
      {analytics.isError && data && (
        <Alert severity="warning" sx={{ mb: 2.5 }}>
          {t('refreshError')}
        </Alert>
      )}
      {hasNoData && !isInitialLoading && (
        <Alert severity="info" sx={{ mb: 2.5 }}>
          {t('empty')}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<DoneAllOutlined fontSize="small" />}
            label={t('stats.completed')}
            value={data?.totals.completed ?? 0}
            helper={t('stats.completedHelp')}
            tone="success"
            isLoading={isInitialLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<AssignmentLateOutlined fontSize="small" />}
            label={t('stats.overdue')}
            value={data?.totals.overdue ?? 0}
            helper={t('stats.overdueHelp')}
            tone="warning"
            isLoading={isInitialLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<AccessTimeOutlined fontSize="small" />}
            label={t('stats.cycleTime')}
            value={
              data?.cycleTime.averageDays === null ||
              data?.cycleTime.averageDays === undefined
                ? t('notAvailable')
                : t('days', { count: data.cycleTime.averageDays })
            }
            helper={t('stats.cycleTimeHelp', {
              count: data?.cycleTime.sampleCount ?? 0,
            })}
            isLoading={isInitialLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<TrendingUpOutlined fontSize="small" />}
            label={t('stats.onTime')}
            value={formatRatio(data?.completionOnTime.onTimeRatio)}
            helper={t('stats.onTimeHelp', {
              late: data?.completionOnTime.late ?? 0,
            })}
            isLoading={isInitialLoading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <ChartPanel
            title={t('charts.completedByTeam')}
            description={t('charts.completedByTeamHelp')}
            isLoading={isInitialLoading}
            isEmpty={!completedByTeam.length}
            emptyText={t('charts.emptyCompleted')}
          >
            {completedByTeamChart}
          </ChartPanel>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <ChartPanel
            title={t('charts.workload')}
            description={t('charts.workloadHelp')}
            isLoading={isInitialLoading}
            isEmpty={!workload.length}
            emptyText={t('charts.emptyWorkload')}
          >
            {workloadChart}
          </ChartPanel>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <ChartPanel
            title={t('charts.throughput')}
            description={t('charts.throughputHelp')}
            isLoading={isInitialLoading}
            isEmpty={!throughput.length}
            emptyText={t('charts.emptyThroughput')}
          >
            {throughputChart}
          </ChartPanel>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <ChartPanel
            title={t('charts.burndown')}
            description={
              displayedBurndownBoardId
                ? t('charts.burndownHelp', {
                    board: selectedBoard?.title ?? t('unknownBoard'),
                  })
                : t('charts.burndownNeedsBoard')
            }
            isLoading={isInitialLoading}
            isEmpty={!displayedBurndownBoardId || !burndownSeries?.length}
            emptyText={
              displayedBurndownBoardId
                ? t('charts.emptyBurndown')
                : t('charts.pickBoard')
            }
          >
            {burndownChart}
          </ChartPanel>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            variant="outlined"
            sx={{
              minWidth: 0,
              height: '100%',
              p: { xs: 1.75, sm: 2 },
              borderRadius: '8px',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {t('overdue.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {t('overdue.description')}
            </Typography>
            {isInitialLoading ? (
              <Stack spacing={1} sx={{ mt: 2 }}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} variant="rounded" height={58} />
                ))}
              </Stack>
            ) : data?.overdue.topTasks.length ? (
              <Stack spacing={1} sx={{ mt: 2 }}>
                {data.overdue.topTasks.map((task) => (
                  <Paper
                    key={task.id}
                    component={Link}
                    href={`/workspaces/${workspaceId}/boards/${task.boardId}?taskId=${encodeURIComponent(task.id)}`}
                    variant="outlined"
                    sx={{
                      p: 1.25,
                      borderRadius: '8px',
                      color: 'inherit',
                      textDecoration: 'none',
                      '&:hover': { borderColor: 'primary.main' },
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
                      {task.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {task.boardTitle ?? t('unknownBoard')} /{' '}
                      {formatDate(task.dueDate)}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Alert severity="success" sx={{ mt: 2 }}>
                {t('overdue.empty')}
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            variant="outlined"
            sx={{
              minWidth: 0,
              height: '100%',
              p: { xs: 1.75, sm: 2 },
              borderRadius: '8px',
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', mb: 0.5 }}
            >
              <GroupsOutlined color="primary" fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {t('workload.title')}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {t('workload.description')}
            </Typography>
            {isInitialLoading ? (
              <Stack spacing={1} sx={{ mt: 2 }}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} variant="rounded" height={50} />
                ))}
              </Stack>
            ) : workload.length ? (
              <Stack spacing={1} sx={{ mt: 2 }}>
                {workload.slice(0, 6).map((item) => (
                  <Stack
                    key={item.id ?? 'unassigned'}
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    sx={{
                      p: 1.25,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '8px',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
                        {item.name ?? t('unassignedAssignee')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('workload.estimate', {
                          estimate: formatHours(item.estimateMinutes),
                          points: item.storyPoints,
                        })}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <Chip
                        size="small"
                        label={t('workload.open', { count: item.openCount })}
                      />
                      <Chip
                        size="small"
                        color={item.overdueCount > 0 ? 'warning' : 'default'}
                        label={t('workload.overdue', {
                          count: item.overdueCount,
                        })}
                      />
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                {t('workload.empty')}
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WorkspaceAnalyticsPage;
