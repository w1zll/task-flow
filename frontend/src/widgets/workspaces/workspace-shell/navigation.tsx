import {
  AssignmentTurnedInOutlined,
  DashboardOutlined,
  GroupsOutlined,
  SettingsOutlined,
  ViewKanbanOutlined,
} from '@mui/icons-material';
import type { ReactNode } from 'react';

interface WorkspaceNavItem {
  key: 'overview' | 'myTasks' | 'teams' | 'boards' | 'settings';
  icon: ReactNode;
  href: (workspaceId: string) => string;
}

export const workspaceNavItems = [
  {
    key: 'overview',
    icon: <DashboardOutlined />,
    href: (workspaceId: string) => `/workspaces/${workspaceId}`,
  },
  {
    key: 'myTasks',
    icon: <AssignmentTurnedInOutlined />,
    href: (workspaceId: string) => `/workspaces/${workspaceId}/my-tasks`,
  },
  {
    key: 'teams',
    icon: <GroupsOutlined />,
    href: (workspaceId: string) => `/workspaces/${workspaceId}/teams`,
  },
  {
    key: 'boards',
    icon: <ViewKanbanOutlined />,
    href: (workspaceId: string) => `/workspaces/${workspaceId}/boards`,
  },
  {
    key: 'settings',
    icon: <SettingsOutlined />,
    href: (workspaceId: string) => `/workspaces/${workspaceId}/settings`,
  },
] as const satisfies readonly WorkspaceNavItem[];

export type WorkspaceNavKey = (typeof workspaceNavItems)[number]['key'];

export const getActiveNavKey = (
  pathname: string,
  workspaceId: string,
): WorkspaceNavKey => {
  const base = `/workspaces/${workspaceId}`;
  if (pathname === base) return 'overview';
  if (pathname.startsWith(`${base}/my-tasks`)) return 'myTasks';
  if (pathname.startsWith(`${base}/teams`)) return 'teams';
  if (pathname.startsWith(`${base}/boards`)) return 'boards';
  if (pathname.startsWith(`${base}/settings`)) return 'settings';
  return 'overview';
};
