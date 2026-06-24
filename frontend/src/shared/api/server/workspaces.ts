import 'server-only';

import { Workspace } from '@/shared/api/api';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const apiBaseUrl = process.env.API_URL || 'http://localhost:3001';

export const getWorkspacesForCurrentUser = async (): Promise<Workspace[]> => {
  const cookieStore = await cookies();
  const response = await fetch(`${apiBaseUrl}/api/workspaces`, {
    cache: 'no-store',
    headers: {
      cookie: cookieStore.toString(),
    },
  });

  if (response.status === 401) {
    redirect('/auth/login');
  }

  if (!response.ok) {
    throw new Error(`Workspace API request failed: ${response.status}`);
  }

  return response.json() as Promise<Workspace[]>;
};
