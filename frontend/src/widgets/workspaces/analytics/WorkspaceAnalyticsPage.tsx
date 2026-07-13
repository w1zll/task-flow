'use client';

import { useBoards } from '@/shared/queries/boards.queries';
import { useWorkspaceAnalyticsDashboard } from '@/shared/queries/workspace-analytics.queries';
import { useWorkspaceTeams } from '@/shared/queries/teams.queries';
import { useWorkspaceMembers } from '@/shared/queries/workspaces.queries';
import { QueryStatsOutlined } from '@mui/icons-material';
import { Alert, Box, Chip, Stack, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import AnalyticsChartGrid from './AnalyticsChartGrid';
import AnalyticsDetailsSection from './AnalyticsDetailsSection';
import AnalyticsFilterPanel from './AnalyticsFilterPanel';
import AnalyticsKpiSummary from './AnalyticsKpiSummary';
import type { AnalyticsFilters } from './analytics-filters';
import { useWorkspaceAnalyticsFilters } from './useWorkspaceAnalyticsFilters';

interface Props {
  workspaceId: string;
  initialFilters: AnalyticsFilters;
}

const WorkspaceAnalyticsPage = ({ workspaceId, initialFilters }: Props) => {
  const t = useTranslations('WorkspaceAnalytics');
  const filterController = useWorkspaceAnalyticsFilters(initialFilters);
  const { data: boards = [], isLoading: isBoardsLoading } = useBoards();
  const teams = useWorkspaceTeams(workspaceId);
  const members = useWorkspaceMembers(workspaceId);
  const analytics = useWorkspaceAnalyticsDashboard(
    workspaceId,
    filterController.queryFilters,
  );
  const data = analytics.data;
  const isInitialLoading = analytics.isLoading && !data;
  const isRefreshing =
    Boolean(data) && (filterController.isPending || analytics.isFetching);
  const workspaceBoards = useMemo(
    () =>
      boards
        .filter((board) => board.workspaceId === workspaceId)
        .sort((a, b) => a.title.localeCompare(b.title)),
    [boards, workspaceId],
  );
  const hasNoData = Boolean(data) && data!.totals.total === 0;

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

      <AnalyticsFilterPanel
        filters={filterController.filters}
        boards={workspaceBoards}
        teams={teams.data ?? []}
        members={members.data ?? []}
        isBoardsLoading={isBoardsLoading}
        isTeamsLoading={teams.isLoading}
        isMembersLoading={members.isLoading}
        isRefreshing={isRefreshing}
        onUpdate={filterController.update}
        onReset={filterController.reset}
      />

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

      <AnalyticsKpiSummary data={data} isLoading={isInitialLoading} />
      <AnalyticsChartGrid
        data={data}
        boards={workspaceBoards}
        isLoading={isInitialLoading}
      />
      <AnalyticsDetailsSection
        workspaceId={workspaceId}
        data={data}
        isLoading={isInitialLoading}
      />
    </Box>
  );
};

export default WorkspaceAnalyticsPage;
