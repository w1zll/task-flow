import BoardsClientPage from '@/widgets/boards/BoardsClientPage';
import { getBoardsForCurrentUser } from '@/shared/api/server/boards';
import { getWorkspacesForCurrentUser } from '@/shared/api/server/workspaces';
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
  const [boards, workspaces] = await Promise.all([
    getBoardsForCurrentUser(),
    getWorkspacesForCurrentUser(),
  ]);

  queryClient.setQueryData(queryKeys.boards, boards);
  queryClient.setQueryData(queryKeys.workspaces, workspaces);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BoardsClientPage initialWorkspaces={workspaces} />
    </HydrationBoundary>
  );
};

export default BoardsPage;
