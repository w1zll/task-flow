import BoardsClientPage from '@/widgets/boards/BoardsClientPage';
import { Metadata } from 'next/types';

export const metadata: Metadata = {
  title: 'Мои доски',
  description: 'Управление досками',
};

const BoardsPage = () => {
  return <BoardsClientPage />;
};

export default BoardsPage;
