const CACHE_VERSION = 'taskflow-pwa-readonly-offline-v2';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const NAVIGATION_CACHE = `${CACHE_VERSION}-pages`;
const ROUTE_PAYLOAD_CACHE = `${CACHE_VERSION}-route-payloads`;

const APP_SHELL_URLS = [
  '/',
  '/workspaces',
  '/manifest.webmanifest',
  '/icons/taskflow-icon.svg',
  '/icons/taskflow-maskable.svg',
  '/icons/taskflow-icon-192.png',
  '/icons/taskflow-icon-512.png',
  '/icons/taskflow-maskable-192.png',
  '/icons/taskflow-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.ico',
];

const isApiRequest = (url) =>
  url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/');

const isStaticAsset = (request, url) =>
  url.pathname.startsWith('/_next/') ||
  url.pathname.startsWith('/icons/') ||
  ['font', 'image', 'script', 'style'].includes(request.destination);

const isAppRouterPayloadRequest = (request, url) =>
  request.headers.get('rsc') === '1' || url.searchParams.has('_rsc');

const getRoutePayloadCacheKey = (request) => {
  const url = new URL(request.url);
  url.search = '';
  url.hash = '';
  url.searchParams.set('__taskflow_rsc', '1');

  return new Request(url.toString(), {
    method: 'GET',
    headers: {
      accept: request.headers.get('accept') || 'text/x-component',
    },
  });
};

const putIfCacheable = async (cache, request, response) => {
  if (!response || !response.ok) return;
  await cache.put(request, response.clone());
};

const cacheFirst = async (request) => {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await putIfCacheable(cache, request, response);
  return response;
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(async (response) => {
      await putIfCacheable(cache, request, response);
      return response;
    })
    .catch(() => cached);

  return cached || network;
};

const navigationFallback = async (request) => {
  const navigationCache = await caches.open(NAVIGATION_CACHE);
  const shellCache = await caches.open(SHELL_CACHE);
  const cachedPage = await navigationCache.match(request);
  if (cachedPage) return cachedPage;

  return (
    (await navigationCache.match('/workspaces')) ||
    (await shellCache.match('/workspaces')) ||
    (await shellCache.match('/')) ||
    Response.error()
  );
};

const networkFirstNavigation = async (request) => {
  const cache = await caches.open(NAVIGATION_CACHE);

  try {
    const response = await fetch(request);
    await putIfCacheable(cache, request, response);
    return response;
  } catch {
    return navigationFallback(request);
  }
};

const networkFirstRoutePayload = async (request) => {
  const cache = await caches.open(ROUTE_PAYLOAD_CACHE);
  const cacheKey = getRoutePayloadCacheKey(request);

  try {
    const response = await fetch(request);
    await putIfCacheable(cache, cacheKey, response);
    return response;
  } catch {
    const cached = await cache.match(cacheKey);
    return cached || Response.error();
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        Promise.all(
          APP_SHELL_URLS.map(async (url) => {
            try {
              const request = new Request(url, { cache: 'reload' });
              const response = await fetch(request);
              await putIfCacheable(cache, request, response);
            } catch (error) {
              console.warn('[PWA] Failed to cache app shell URL', url, error);
            }
          }),
        ),
      )
      .catch((error) => {
        console.warn('[PWA] Failed to warm app shell cache', error);
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith('taskflow-pwa-') &&
                !cacheName.startsWith(CACHE_VERSION),
            )
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isApiRequest(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isAppRouterPayloadRequest(request, url)) {
    event.respondWith(networkFirstRoutePayload(request));
    return;
  }

  if (url.pathname.startsWith('/icons/') || request.destination === 'font') {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isStaticAsset(request, url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
