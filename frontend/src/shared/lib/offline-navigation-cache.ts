'use client';

export const OFFLINE_NAVIGATION_CACHE =
  'taskflow-pwa-readonly-offline-v4-pages';
export const OFFLINE_ROUTES_WARMED_EVENT = 'taskflow:offline-routes-warmed';
const ROUTE_WARM_TIMEOUT_MS = 5000;

const canUseNavigationCache = () =>
  typeof window !== 'undefined' && 'caches' in window;

const fetchRouteWithTimeout = async (request: Request) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    ROUTE_WARM_TIMEOUT_MS,
  );

  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const warmOfflineNavigationRoutes = async (routes: string[]) => {
  if (!canUseNavigationCache()) return;

  const cache = await window.caches.open(OFFLINE_NAVIGATION_CACHE);
  const uniqueRoutes = Array.from(new Set(routes));

  await Promise.all(
    uniqueRoutes.map(async (route) => {
      try {
        const request = new Request(route, {
          cache: 'no-store',
          credentials: 'include',
        });
        const response = await fetchRouteWithTimeout(request);

        if (response.ok) {
          await cache.put(route, response.clone());
        }
      } catch {
        // Best-effort cache warming. Offline reads still use query cache.
      }
    }),
  );

  window.dispatchEvent(new Event(OFFLINE_ROUTES_WARMED_EVENT));
};

export const hasCachedOfflineNavigationRoute = async (route: string) => {
  if (!canUseNavigationCache()) return false;

  try {
    const cache = await window.caches.open(OFFLINE_NAVIGATION_CACHE);
    return Boolean(await cache.match(route));
  } catch {
    return false;
  }
};
