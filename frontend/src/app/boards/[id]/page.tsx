import KanbanBoardPage from '@/widgets/kanban/KanbanBoardPage';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next/types';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations('BoardPage');

  return {
    title: t('title', { id }),
    description: t('description', { id }),
  };
}

const BoardPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  return <KanbanBoardPage key={id} boardId={id} />;
};

export default BoardPage;
