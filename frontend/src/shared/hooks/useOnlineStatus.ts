'use client';

import { useEffect, useState } from 'react';
import {
  getBrowserOnlineSnapshot,
  subscribeToBrowserOnlineStatus,
} from '@/shared/lib/offline';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(getBrowserOnlineSnapshot);

  useEffect(() => {
    const syncStatus = () => setIsOnline(getBrowserOnlineSnapshot());

    syncStatus();
    return subscribeToBrowserOnlineStatus(syncStatus);
  }, []);

  return isOnline;
};

export const useIsOffline = () => !useOnlineStatus();
