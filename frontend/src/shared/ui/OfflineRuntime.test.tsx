import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render } from '@testing-library/react';
import { queryKeys } from '@/shared/queries/board-query-keys';
import { warmOfflineNavigationRoutes } from '@/shared/lib/offline-navigation-cache';
import OfflineRuntime from './OfflineRuntime';

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

jest.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: jest.fn() }),
}));

jest.mock('@/shared/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => true,
}));

jest.mock('@/shared/lib/offline-navigation-cache', () => ({
  warmOfflineNavigationRoutes: jest.fn().mockResolvedValue(undefined),
}));

const renderRuntime = (queryClient: QueryClient) =>
  render(
    <QueryClientProvider client={queryClient}>
      <OfflineRuntime />
    </QueryClientProvider>,
  );

describe('OfflineRuntime navigation cache warming', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('does not warm navigation routes for task comments cache updates', () => {
    const queryClient = new QueryClient();
    renderRuntime(queryClient);

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    (warmOfflineNavigationRoutes as jest.Mock).mockClear();

    act(() => {
      queryClient.setQueryData(queryKeys.taskComments('task-1'), []);
      jest.advanceTimersByTime(1500);
    });

    expect(warmOfflineNavigationRoutes).not.toHaveBeenCalled();
  });

  it('warms navigation routes when board data becomes available', () => {
    const queryClient = new QueryClient();
    renderRuntime(queryClient);

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    (warmOfflineNavigationRoutes as jest.Mock).mockClear();

    act(() => {
      queryClient.setQueryData(queryKeys.boards, [
        { id: 'board-1', workspaceId: 'workspace-1' },
      ]);
      queryClient.setQueryData(queryKeys.board('board-1'), {
        id: 'board-1',
        workspaceId: 'workspace-1',
      });
      jest.advanceTimersByTime(1500);
    });

    expect(warmOfflineNavigationRoutes).toHaveBeenCalledWith(
      expect.arrayContaining([
        '/workspaces',
        '/workspaces/workspace-1',
        '/workspaces/workspace-1/boards',
        '/workspaces/workspace-1/boards/board-1',
      ]),
    );
  });
});
