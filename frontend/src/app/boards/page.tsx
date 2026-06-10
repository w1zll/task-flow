import BoardsClientPage from '@/widgets/boards/BoardsClientPage';
import { getBoardsForCurrentUser } from '@/shared/api/server/boards';
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Boards');

  return {
    title: t('title'),
    description: t('description'),
  };
}

const BoardsPage = async () => {
  const queryClient = new QueryClient();
  const boards = await getBoardsForCurrentUser();

  queryClient.setQueryData(queryKeys.boards, boards);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BoardsClientPage />
    </HydrationBoundary>
  );
};

export default BoardsPage;
