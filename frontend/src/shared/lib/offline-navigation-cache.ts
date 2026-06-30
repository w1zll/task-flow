'use client';

const NAVIGATION_CACHE = 'taskflow-pwa-readonly-offline-v2-pages';
export const OFFLINE_ROUTES_WARMED_EVENT = 'taskflow:offline-routes-warmed';

const canUseNavigationCache = () =>
  typeof window !== 'undefined' && 'caches' in window;

export const warmOfflineNavigationRoutes = async (routes: string[]) => {
  if (!canUseNavigationCache()) return;

  const cache = await window.caches.open(NAVIGATION_CACHE);
  const uniqueRoutes = Array.from(new Set(routes));

  await Promise.all(
    uniqueRoutes.map(async (route) => {
      try {
        const request = new Request(route, {
          cache: 'no-store',
          credentials: 'include',
        });
        const response = await fetch(request);

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
    const cache = await window.caches.open(NAVIGATION_CACHE);
    return Boolean(await cache.match(route));
  } catch {
    return false;
  }
};
