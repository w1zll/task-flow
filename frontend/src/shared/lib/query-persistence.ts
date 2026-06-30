'use client';

import {
  type DehydratedState,
  type Query,
  type QueryClient,
  dehydrate,
  hydrate,
} from '@tanstack/react-query';

const DB_NAME = 'taskflow-query-cache';
const DB_VERSION = 1;
const STORE_NAME = 'query-cache';
const CACHE_KEY = 'taskflow-query-cache-v1';
const CACHE_BUSTER = 'taskflow-pwa-readonly-offline-v1';
const MAX_CACHE_AGE_MS = 1000 * 60 * 60 * 24 * 3;
const PERSIST_THROTTLE_MS = 1200;

type PersistedQueryCache = {
  buster: string;
  timestamp: number;
  state: DehydratedState;
};

let dbPromise: Promise<IDBDatabase> | null = null;

const canUseIndexedDb = () =>
  typeof window !== 'undefined' && 'indexedDB' in window;

const openDb = () => {
  if (!canUseIndexedDb()) {
    return Promise.reject(new Error('IndexedDB is unavailable'));
  }

  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to open IndexedDB'));
  });

  return dbPromise;
};

const readPersistedCache = async () => {
  const db = await openDb();

  return new Promise<PersistedQueryCache | undefined>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(CACHE_KEY);

    request.onsuccess = () =>
      resolve(request.result as PersistedQueryCache | undefined);
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to read persisted cache'));
  });
};

const writePersistedCache = async (cache: PersistedQueryCache) => {
  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const request = transaction.objectStore(STORE_NAME).put(cache, CACHE_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to write persisted cache'));
  });
};

export const clearPersistedQueryCache = async () => {
  if (!canUseIndexedDb()) return;

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const request = transaction.objectStore(STORE_NAME).delete(CACHE_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error ?? new Error('Failed to clear persisted cache'));
    });
  } catch (error) {
    console.warn('[PWA] Failed to clear persisted query cache', error);
  }
};

const isPersistableQuery = (query: Query) => {
  if (query.state.status !== 'success' || query.state.dataUpdatedAt <= 0) {
    return false;
  }

  const [scope, , childScope] = query.queryKey;

  if (scope === 'boards') return true;
  if (scope !== 'workspaces') return false;

  return childScope !== 'invites';
};

const persistQueryClient = async (queryClient: QueryClient) => {
  const state = dehydrate(queryClient, {
    shouldDehydrateQuery: isPersistableQuery,
  });
  const previousCache = await readPersistedCache().catch(() => undefined);
  const previousQueries =
    previousCache?.buster === CACHE_BUSTER ? previousCache.state.queries : [];
  const mergedQueries = new Map(
    previousQueries.map((query) => [query.queryHash, query]),
  );

  state.queries.forEach((query) => {
    mergedQueries.set(query.queryHash, query);
  });

  await writePersistedCache({
    buster: CACHE_BUSTER,
    timestamp: Date.now(),
    state: {
      ...state,
      queries: Array.from(mergedQueries.values()),
    },
  });
};

export const restorePersistedQueryCache = async (queryClient: QueryClient) => {
  if (!canUseIndexedDb()) return;

  try {
    const cache = await readPersistedCache();
    if (!cache) return;

    const isExpired = Date.now() - cache.timestamp > MAX_CACHE_AGE_MS;
    if (cache.buster !== CACHE_BUSTER || isExpired) {
      await clearPersistedQueryCache();
      return;
    }

    hydrate(queryClient, cache.state);
  } catch (error) {
    console.warn('[PWA] Failed to restore persisted query cache', error);
  }
};

export const installQueryCachePersistence = (queryClient: QueryClient) => {
  if (!canUseIndexedDb()) return () => undefined;

  let timer: number | null = null;

  const schedulePersist = () => {
    if (timer) return;

    timer = window.setTimeout(() => {
      timer = null;
      void persistQueryClient(queryClient).catch((error) => {
        console.warn('[PWA] Failed to persist query cache', error);
      });
    }, PERSIST_THROTTLE_MS);
  };

  const unsubscribe = queryClient.getQueryCache().subscribe(schedulePersist);

  schedulePersist();

  return () => {
    if (timer) window.clearTimeout(timer);
    unsubscribe();
  };
};
