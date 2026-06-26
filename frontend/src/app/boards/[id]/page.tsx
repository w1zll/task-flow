import { getBoardForCurrentUser } from '@/shared/api/server/boards';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next/types';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations('BoardPage');

  return {
    title: t('title', { id }),
    description: t('description', { id }),
  };
}

const LegacyBoardPage = async ({ params }: Props) => {
  const { id } = await params;
  const board = await getBoardForCurrentUser(id);

  redirect(`/workspaces/${board.workspaceId}/boards/${board.id}`);
};

export default LegacyBoardPage;
