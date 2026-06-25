export const queryKeys = {
  boards: ['boards'] as const,
  board: (id: string) => ['boards', id] as const,
  boardMembers: (id: string) => ['boards', id, 'members'] as const,
  tasks: (columnId: string) => ['tasks', columnId] as const,
  boardAnalytics: (id?: string) => ['boards', id, 'analytics'] as const,
  workspaces: ['workspaces'] as const,
  workspaceMembers: (id: string) => ['workspaces', id, 'members'] as const,
  workspaceInvites: (id: string) => ['workspaces', id, 'invites'] as const,
  workspaceInvitePreview: (token: string) =>
    ['workspace-invites', token, 'preview'] as const,
};
