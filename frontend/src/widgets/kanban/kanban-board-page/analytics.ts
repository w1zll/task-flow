import dayjs from 'dayjs';

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly';

export interface ChartAnalyticsPoint {
  period: string;
  count: number;
}

export const formatAnalyticsPeriod = (
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
