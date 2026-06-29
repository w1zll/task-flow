import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import {
  useBoardDailyAnalytics,
  useBoardMonthlyAnalytics,
  useBoardWeeklyAnalytics,
  useTaskCompletionSummary,
} from '@/shared/queries/boards.queries';
import {
  type AnalyticsPeriod,
  formatAnalyticsPeriod,
} from './analytics';

export const useBoardAnalyticsController = (
  boardId: string,
  dayjsLocale: string,
) => {
  const summaryAnalytics = useTaskCompletionSummary(boardId);
  const dailyAnalytics = useBoardDailyAnalytics(boardId);
  const weeklyAnalytics = useBoardWeeklyAnalytics(boardId);
  const monthlyAnalytics = useBoardMonthlyAnalytics(boardId);
  const [analyticsPeriod, setAnalyticsPeriod] =
    useState<AnalyticsPeriod>('daily');

  const todayCompletedCount = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return (
      dailyAnalytics.data?.find((item) => item.period === today)?.count ?? 0
    );
  }, [dailyAnalytics.data]);

  const chartAnalytics =
    analyticsPeriod === 'weekly'
      ? weeklyAnalytics
      : analyticsPeriod === 'monthly'
        ? monthlyAnalytics
        : dailyAnalytics;
  const chartData = useMemo(
    () => chartAnalytics.data ?? [],
    [chartAnalytics.data],
  );
  const chartXAxisLabels = useMemo(
    () =>
      chartData.map((item) =>
        formatAnalyticsPeriod(item.period, analyticsPeriod, dayjsLocale),
      ),
    [analyticsPeriod, chartData, dayjsLocale],
  );

  return {
    analyticsPeriod,
    chartData,
    chartXAxisLabels,
    isChartLoading: chartAnalytics.isLoading,
    isChartError: chartAnalytics.isError,
    onTimeCount: summaryAnalytics.data?.onTime,
    lateCount: summaryAnalytics.data?.late,
    todayCompletedCount,
    setAnalyticsPeriod,
  };
};
