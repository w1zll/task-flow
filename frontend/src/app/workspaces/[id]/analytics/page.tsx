import WorkspaceAnalyticsPage from '@/widgets/workspaces/analytics/WorkspaceAnalyticsPage';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('WorkspaceAnalytics');

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

const WorkspaceAnalyticsRoute = async ({ params }: Props) => {
  const { id } = await params;

  return <WorkspaceAnalyticsPage workspaceId={id} />;
};

export default WorkspaceAnalyticsRoute;
