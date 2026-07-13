'use client';

import type { DehydratedState, Query } from '@tanstack/react-query';
import type {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client';

const DB_NAME = 'taskflow-query-cache';
const DB_VERSION = 1;
const STORE_NAME = 'query-cache';
const CACHE_KEY = 'taskflow-query-cache-v1';
const LEGACY_QUERY_CACHE_BUSTER = 'taskflow-pwa-readonly-offline-v1';
export const QUERY_CACHE_BUSTER = 'taskflow-pwa-readonly-offline-v2';
export const QUERY_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 3;
const PERSIST_THROTTLE_MS = 1200;

let dbPromise: Promise<IDBDatabase> | null = null;
let persistTimer: number | null = null;
let pendingClient: PersistedClient | null = null;
let pendingWaiters: Array<() => void> = [];
let operationChain: Promise<void> = Promise.resolve();

const canUseIndexedDb = () =>
  typeof window !== 'undefined' && 'indexedDB' in window;

type LegacyPersistedClient = {
  buster: string;
  timestamp: number;
  state: DehydratedState;
};

export const normalizePersistedClient = (
  value: unknown,
): PersistedClient | undefined => {
  if (!value || typeof value !== 'object') return undefined;

  const candidate = value as Partial<PersistedClient & LegacyPersistedClient>;
  if (
    typeof candidate.timestamp !== 'number' ||
    typeof candidate.buster !== 'string'
  ) {
    return undefined;
  }

  if (candidate.clientState) {
    return candidate as PersistedClient;
  }

  if (
    candidate.buster === LEGACY_QUERY_CACHE_BUSTER &&
    candidate.state
  ) {
    return {
      timestamp: candidate.timestamp,
      buster: QUERY_CACHE_BUSTER,
      clientState: candidate.state,
    };
  }

  return undefined;
};

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

const readPersistedClient = async () => {
  if (!canUseIndexedDb()) return undefined;

  const db = await openDb();
  return new Promise<PersistedClient | undefined>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(CACHE_KEY);

    request.onsuccess = () => {
      const rawValue = request.result as unknown;
      if (!rawValue) {
        resolve(undefined);
        return;
      }
      const value = normalizePersistedClient(rawValue);
      if (!value) {
        void removePersistedClient().then(
          () => resolve(undefined),
          reject,
        );
        return;
      }
      resolve(value);
    };
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to read IndexedDB cache'));
  });
};

const writePersistedClient = async (client: PersistedClient) => {
  if (!canUseIndexedDb()) return;

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const request = transaction.objectStore(STORE_NAME).put(client, CACHE_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to write IndexedDB cache'));
  });
};

const removePersistedClient = async () => {
  if (!canUseIndexedDb()) return;

  if (persistTimer !== null) {
    window.clearTimeout(persistTimer);
    persistTimer = null;
  }
  pendingClient = null;
  pendingWaiters.splice(0).forEach((resolve) => resolve());

  operationChain = operationChain.catch(() => undefined).then(async () => {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const request = transaction.objectStore(STORE_NAME).delete(CACHE_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error ?? new Error('Failed to clear IndexedDB cache'));
    });
  });

  await operationChain;
};

const flushPersistedClient = () => {
  persistTimer = null;
  const client = pendingClient;
  const waiters = pendingWaiters;
  pendingClient = null;
  pendingWaiters = [];
  if (!client) {
    waiters.forEach((resolve) => resolve());
    return;
  }

  operationChain = operationChain
    .catch(() => undefined)
    .then(() => writePersistedClient(client));
  void operationChain.then(
    () => waiters.forEach((resolve) => resolve()),
    (error) => {
      console.warn('[PWA] Failed to persist query cache', error);
      waiters.forEach((resolve) => resolve());
    },
  );
};

const persistClient = (client: PersistedClient) => {
  if (!canUseIndexedDb()) return Promise.resolve();

  pendingClient = client;
  const result = new Promise<void>((resolve) => {
    pendingWaiters.push(resolve);
  });

  if (persistTimer === null) {
    persistTimer = window.setTimeout(
      flushPersistedClient,
      PERSIST_THROTTLE_MS,
    );
  }

  return result;
};

export const queryCachePersister: Persister = {
  persistClient,
  restoreClient: readPersistedClient,
  removeClient: removePersistedClient,
};

export const shouldPersistQuery = (query: Query) => {
  if (query.state.status !== 'success' || query.state.dataUpdatedAt <= 0) {
    return false;
  }

  const [scope, , childScope] = query.queryKey;
  if (scope === 'boards') return true;
  if (scope !== 'workspaces') return false;

  return childScope !== 'invites';
};

export const clearPersistedQueryCache = async () => {
  try {
    await queryCachePersister.removeClient();
  } catch (error) {
    console.warn('[PWA] Failed to clear persisted query cache', error);
  }
};
