import 'server-only';

import {
  Workspace,
  WorkspaceInvite,
  WorkspaceMember,
} from '@/shared/api/api';
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

const fetchWorkspaceApi = async <T>(path: string): Promise<T> => {
  const cookieStore = await cookies();
  const response = await fetch(`${apiBaseUrl}${path}`, {
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

  return response.json() as Promise<T>;
};

export const getWorkspaceMembersForCurrentUser = (
  workspaceId: string,
): Promise<WorkspaceMember[]> =>
  fetchWorkspaceApi(`/api/workspaces/${workspaceId}/members`);

export const getWorkspaceInvitesForCurrentUser = (
  workspaceId: string,
): Promise<WorkspaceInvite[]> =>
  fetchWorkspaceApi(`/api/workspaces/${workspaceId}/invites`);
