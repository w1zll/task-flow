import WorkspaceSettingsPage from '@/widgets/workspaces/WorkspaceSettingsPage';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('WorkspaceSettings');
  return {
    title: t('title'),
    description: t('description'),
  };
}

const WorkspaceSettingsRoute = async ({ params }: Props) => {
  const { id } = await params;
  return <WorkspaceSettingsPage workspaceId={id} />;
};

export default WorkspaceSettingsRoute;
