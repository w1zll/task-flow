'use client';

import { Close } from '@mui/icons-material';
import {
  Box,
  Drawer,
  IconButton,
  Skeleton,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTranslations } from 'next-intl';
import type { AnalyticsPeriod, ChartAnalyticsPoint } from './analytics';

interface BoardStatsDrawerProps {
  open: boolean;
  analyticsPeriod: AnalyticsPeriod;
  chartData: ChartAnalyticsPoint[];
  chartXAxisLabels: string[];
  isChartLoading: boolean;
  isChartError: boolean;
  onTimeCount?: number;
  lateCount?: number;
  todayCompletedCount: number;
  onClose: () => void;
  onAnalyticsPeriodChange: (period: AnalyticsPeriod) => void;
}

const BoardStatsDrawer = ({
  open,
  analyticsPeriod,
  chartData,
  chartXAxisLabels,
  isChartLoading,
  isChartError,
  onTimeCount,
  lateCount,
  todayCompletedCount,
  onClose,
  onAnalyticsPeriodChange,
}: BoardStatsDrawerProps) => {
  const t = useTranslations('BoardPage');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), {
    defaultMatches: false,
  });
  const analyticsPeriodLabels: Record<AnalyticsPeriod, string> = {
    daily: t('analyticsDays'),
    weekly: t('analyticsWeeks'),
    monthly: t('analyticsMonths'),
  };

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? '100%' : 360,
            height: isMobile ? '100%' : 'auto',
            bgcolor: 'background.paper',
            borderLeft: isMobile ? 'none' : '1px solid',
            borderTop: isMobile ? '1px solid' : 'none',
            borderColor: 'divider',
            overflowY: 'auto',
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
          <IconButton
            size="small"
            onClick={onClose}
            aria-label={t('closePanel')}
            sx={{ width: { xs: 44, sm: 32 }, height: { xs: 44, sm: 32 } }}
          >
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
            {t('onTime', { count: onTimeCount ?? '-' })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('late', { count: lateCount ?? '-' })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('today', { count: todayCompletedCount })}
          </Typography>
          <Tabs
            value={analyticsPeriod}
            onChange={(_, value: AnalyticsPeriod) =>
              onAnalyticsPeriodChange(value)
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
  );
};

export default BoardStatsDrawer;
