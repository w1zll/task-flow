'use client';

import {
  useDeleteWorkspace,
  useRemoveWorkspaceMember,
  useUpdateWorkspaceMemberRole,
  useWorkspaceMembers,
  useWorkspaces,
} from '@/shared/queries/workspaces.queries';
import { useAuthStore } from '@/shared/store/root.store';
import { Alert, Box, Skeleton } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import WorkspaceInvitesSection from './WorkspaceInvitesSection';
import DeleteWorkspaceDialog from './workspace-settings/DeleteWorkspaceDialog';
import RemoveWorkspaceMemberDialog from './workspace-settings/RemoveWorkspaceMemberDialog';
import WorkspaceDangerZone from './workspace-settings/WorkspaceDangerZone';
import WorkspaceMembersSection from './workspace-settings/WorkspaceMembersSection';
import WorkspaceSettingsHeader from './workspace-settings/WorkspaceSettingsHeader';

interface Props {
  workspaceId: string;
}

const WorkspaceSettingsPage = ({ workspaceId }: Props) => {
  const t = useTranslations('WorkspaceSettings');
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const currentUser = useAuthStore((state) => state.user);
  const setActiveWorkspace = useAuthStore(
    (state) => state.setActiveWorkspace,
  );
  const [memberToRemoveId, setMemberToRemoveId] = useState<string | null>(null);
  const [isDeleteWorkspaceOpen, setDeleteWorkspaceOpen] = useState(false);
  const workspaces = useWorkspaces();
  const members = useWorkspaceMembers(workspaceId);
  const updateMemberRole = useUpdateWorkspaceMemberRole(workspaceId);
  const removeMember = useRemoveWorkspaceMember(workspaceId);
  const deleteWorkspace = useDeleteWorkspace();
  const workspace = workspaces.data?.find((item) => item.id === workspaceId);
  const memberToRemove = members.data?.find(
    (member) => member.id === memberToRemoveId,
  );
  const inviteManagerRole =
    workspace?.currentUserRole === 'owner' ||
    workspace?.currentUserRole === 'admin'
      ? workspace.currentUserRole
      : null;
  const canDeleteWorkspace = workspace?.currentUserRole === 'owner';

  const changeMemberRole = (
    memberId: string,
    role: 'admin' | 'member',
  ) => {
    updateMemberRole.mutate(
      { memberId, role },
      {
        onSuccess: () =>
          enqueueSnackbar(t('memberRoleUpdated'), { variant: 'success' }),
        onError: () =>
          enqueueSnackbar(t('memberUpdateError'), { variant: 'error' }),
      },
    );
  };

  const requestCloseRemoveMember = () => {
    if (!removeMember.isPending) {
      setMemberToRemoveId(null);
    }
  };

  const confirmRemoveMember = () => {
    if (!memberToRemove) return;

    removeMember.mutate(memberToRemove.id, {
      onSuccess: () => {
        setMemberToRemoveId(null);
        enqueueSnackbar(t('memberRemoved'), { variant: 'success' });
      },
      onError: () =>
        enqueueSnackbar(t('memberRemoveError'), { variant: 'error' }),
    });
  };

  const requestCloseDeleteWorkspace = () => {
    if (!deleteWorkspace.isPending) {
      setDeleteWorkspaceOpen(false);
    }
  };

  const handleDeleteWorkspace = () => {
    if (!workspace || !canDeleteWorkspace) return;

    const nextActiveWorkspace =
      workspace.isActive
        ? (workspaces.data?.find((item) => item.id !== workspace.id)?.id ??
          null)
        : currentUser?.activeWorkspaceId ?? null;

    deleteWorkspace.mutate(workspace.id, {
      onSuccess: () => {
        setActiveWorkspace(nextActiveWorkspace);
        setDeleteWorkspaceOpen(false);
        enqueueSnackbar(t('workspaceDeleted'), { variant: 'success' });
        router.push('/workspaces');
        router.refresh();
      },
      onError: () =>
        enqueueSnackbar(t('workspaceDeleteError'), { variant: 'error' }),
    });
  };

  if (workspaces.isLoading) {
    return (
      <Box
        sx={{
          width: '100%',
          maxWidth: 900,
          minWidth: 0,
          boxSizing: 'border-box',
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          py: { xs: 2.5, sm: 4 },
        }}
      >
        <Skeleton width={280} height={48} />
        <Skeleton variant="rounded" height={220} sx={{ mt: 3 }} />
      </Box>
    );
  }

  if (!workspace || workspaces.isError) {
    return (
      <Box
        sx={{
          width: '100%',
          maxWidth: 900,
          minWidth: 0,
          boxSizing: 'border-box',
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          py: { xs: 2.5, sm: 4 },
        }}
      >
        <Alert severity="error">{t('notFound')}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 900,
        minWidth: 0,
        boxSizing: 'border-box',
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        py: { xs: 2.5, sm: 4 },
      }}
    >
      <WorkspaceSettingsHeader workspace={workspace} />

      <WorkspaceMembersSection
        workspace={workspace}
        members={members.data}
        isLoading={members.isLoading}
        isError={members.isError}
        currentUserId={currentUser?.id}
        isUpdatingRole={updateMemberRole.isPending}
        onChangeRole={changeMemberRole}
        onRemoveMember={setMemberToRemoveId}
      />

      {inviteManagerRole && (
        <WorkspaceInvitesSection
          workspaceId={workspaceId}
          currentUserRole={inviteManagerRole}
        />
      )}

      {canDeleteWorkspace && (
        <WorkspaceDangerZone
          onDeleteWorkspace={() => setDeleteWorkspaceOpen(true)}
        />
      )}

      <RemoveWorkspaceMemberDialog
        member={memberToRemove}
        isRemoving={removeMember.isPending}
        onRequestClose={requestCloseRemoveMember}
        onCancel={() => setMemberToRemoveId(null)}
        onConfirm={confirmRemoveMember}
      />

      <DeleteWorkspaceDialog
        open={isDeleteWorkspaceOpen}
        workspaceName={workspace.name}
        isDeleting={deleteWorkspace.isPending}
        onRequestClose={requestCloseDeleteWorkspace}
        onCancel={() => setDeleteWorkspaceOpen(false)}
        onConfirm={handleDeleteWorkspace}
      />
    </Box>
  );
};

export default WorkspaceSettingsPage;
