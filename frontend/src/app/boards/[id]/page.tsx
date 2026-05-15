import KanbanBoardPage from '@/widgets/kanban/KanbanBoardPage';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next/types';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const t = await getTranslations('BoardPage');

  return {
    title: t('title', { id: params.id }),
    description: t('description', { id: params.id }),
  };
}

const BoardPage = ({ params }: { params: { id: string } }) => {
  return <KanbanBoardPage key={params.id} boardId={params.id} />;
};

export default BoardPage;
