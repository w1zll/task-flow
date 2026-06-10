import KanbanBoardPage from '@/widgets/kanban/KanbanBoardPage';
import { getBoardForCurrentUser } from '@/shared/api/server/boards';
import { queryKeys } from '@/shared/queries/board-query-keys';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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
  const queryClient = new QueryClient();
  const board = await getBoardForCurrentUser(id);

  queryClient.setQueryData(queryKeys.board(id), board);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <KanbanBoardPage key={id} boardId={id} initialBoard={board} />
    </HydrationBoundary>
  );
};

export default BoardPage;
