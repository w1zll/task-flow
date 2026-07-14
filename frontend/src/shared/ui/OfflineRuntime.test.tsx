import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render } from '@testing-library/react';
import { queryKeys } from '@/shared/queries/board-query-keys';
import { warmOfflineNavigationRoutes } from '@/shared/lib/offline-navigation-cache';
import { markNetworkOffline, markNetworkOnline } from '@/shared/lib/offline';
import OfflineRuntime from './OfflineRuntime';

let mockOnlineStatus = true;

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

jest.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: jest.fn() }),
}));

jest.mock('@/shared/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => mockOnlineStatus,
}));

jest.mock('@/shared/lib/offline', () => ({
  markNetworkOffline: jest.fn(),
  markNetworkOnline: jest.fn(),
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
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockOnlineStatus = true;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    global.fetch = originalFetch;
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

  it('keeps the runtime offline for a service worker offline response', async () => {
    mockOnlineStatus = false;
    global.fetch = jest.fn().mockResolvedValue({
      headers: {
        get: (name: string) =>
          name === 'x-taskflow-offline-miss' ? '1' : null,
      },
    });

    await act(async () => {
      renderRuntime(new QueryClient());
      await Promise.resolve();
    });

    expect(markNetworkOffline).toHaveBeenCalled();
    expect(markNetworkOnline).not.toHaveBeenCalled();
  });
});
