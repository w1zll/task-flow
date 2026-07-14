import {
  OFFLINE_NAVIGATION_CACHE,
  OFFLINE_ROUTES_WARMED_EVENT,
  warmOfflineNavigationRoutes,
} from './offline-navigation-cache';

describe('offline navigation cache', () => {
  const originalCaches = window.caches;
  const originalFetch = global.fetch;
  const originalRequest = global.Request;
  const cache = {
    match: jest.fn(),
    put: jest.fn().mockResolvedValue(undefined),
  };
  const open = jest.fn().mockResolvedValue(cache);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: { open },
    });
    global.Request = class MockRequest {
      constructor(
        public readonly input: RequestInfo | URL,
        public readonly init?: RequestInit,
      ) {}
    } as unknown as typeof Request;
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
    global.Request = originalRequest;
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: originalCaches,
    });
  });

  it('warms the same v4 navigation cache used by the service worker', async () => {
    const response = {
      ok: true,
      clone: jest.fn(),
    } as unknown as Response;
    (response.clone as jest.Mock).mockReturnValue(response);
    global.fetch = jest.fn().mockResolvedValue(response);

    await warmOfflineNavigationRoutes(['/workspaces']);

    expect(open).toHaveBeenCalledWith(OFFLINE_NAVIGATION_CACHE);
    expect(OFFLINE_NAVIGATION_CACHE).toBe(
      'taskflow-pwa-readonly-offline-v4-pages',
    );
    expect(cache.put).toHaveBeenCalledWith(
      '/workspaces',
      response,
    );
  });

  it('finishes cache warming when a network request never settles', async () => {
    const warmedListener = jest.fn();
    window.addEventListener(OFFLINE_ROUTES_WARMED_EVENT, warmedListener);
    global.fetch = jest.fn().mockImplementation((_request, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }),
    );

    const warming = warmOfflineNavigationRoutes(['/workspaces']);
    await jest.advanceTimersByTimeAsync(5000);
    await warming;

    expect(cache.put).not.toHaveBeenCalled();
    expect(warmedListener).toHaveBeenCalledTimes(1);
    window.removeEventListener(OFFLINE_ROUTES_WARMED_EVENT, warmedListener);
  });
});
