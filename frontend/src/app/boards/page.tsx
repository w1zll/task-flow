import BoardsClientPage from '@/widgets/boards/BoardsClientPage';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next/types';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Boards');

  return {
    title: t('title'),
    description: t('description'),
  };
}

const BoardsPage = () => {
  return <BoardsClientPage />;
};

export default BoardsPage;
