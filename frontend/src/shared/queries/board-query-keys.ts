export const queryKeys = {
  boards: ['boards'] as const,
  board: (id: string) => ['boards', id] as const,
  boardMembers: (id: string) => ['boards', id, 'members'] as const,
  boardViews: (id: string) => ['boards', id, 'views'] as const,
  tasks: (columnId: string) => ['tasks', columnId] as const,
  boardAnalytics: (id?: string) => ['boards', id, 'analytics'] as const,
  workspaces: ['workspaces'] as const,
  workspaceMembers: (id: string) => ['workspaces', id, 'members'] as const,
  workspaceInvites: (id: string) => ['workspaces', id, 'invites'] as const,
  workspaceInvitePreview: (token: string) =>
    ['workspace-invites', token, 'preview'] as const,
  workspaceTeams: (id: string) => ['workspaces', id, 'teams'] as const,
  myWorkspaceTeams: (id: string) =>
    ['workspaces', id, 'teams', 'mine'] as const,
  teamTasks: (workspaceId: string, teamId: string) =>
    ['workspaces', workspaceId, 'teams', teamId, 'tasks'] as const,
};
