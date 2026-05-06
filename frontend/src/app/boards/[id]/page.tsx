import KanbanBoardPage from '@/widgets/kanban/KanbanBoardPage';
import { Metadata } from 'next/types';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return {
    title: `Доска ${params.id}`,
    description: 'Доска ${params.id}',
  };
}

const BoardPage = ({ params }: { params: { id: string } }) => {
  return <KanbanBoardPage key={params.id} boardId={params.id} />;
};

export default BoardPage;
