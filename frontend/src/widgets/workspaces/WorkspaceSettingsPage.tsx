'use client';

import {
  useDeleteWorkspace,
  useRemoveWorkspaceMember,
  useUpdateWorkspaceMemberRole,
  useWorkspaceMembers,
  useWorkspaces,
} from '@/shared/queries/workspaces.queries';
import { useAuthStore } from '@/shared/store/root.store';
import UserAvatar from '@/shared/ui/UserAvatar';
import {
  Business,
  DeleteOutlined,
  Person,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import WorkspaceInvitesSection from './WorkspaceInvitesSection';

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
  const canDeleteWorkspace = workspace?.currentUserRole === 'owner';

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
      <Box sx={{ maxWidth: 900, mx: 'auto', px: 3, py: 4 }}>
        <Skeleton width={280} height={48} />
        <Skeleton variant="rounded" height={220} sx={{ mt: 3 }} />
      </Box>
    );
  }

  if (!workspace || workspaces.isError) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', px: 3, py: 4 }}>
        <Alert severity="error">{t('notFound')}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          mb: 3,
          alignItems: { xs: 'flex-start', sm: 'center' },
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '6px',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Business />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }} noWrap>
            {workspace.name}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
            <Chip
              size="small"
              label={t(`role.${workspace.currentUserRole}`)}
            />
            {workspace.isPersonal && (
              <Chip size="small" variant="outlined" label={t('personal')} />
            )}
          </Stack>
        </Box>
      </Stack>

      <Paper
        variant="outlined"
        sx={{ borderRadius: '6px', overflow: 'hidden' }}
      >
        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('membersTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('membersDescription')}
          </Typography>
        </Box>
        <Divider />

        {members.isLoading ? (
          <Stack spacing={1.5} sx={{ p: 3 }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={52} />
            ))}
          </Stack>
        ) : members.isError ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {t('membersError')}
          </Alert>
        ) : (
          <Stack divider={<Divider flexItem />}>
            {members.data?.map((member) => {
              const canChangeRole =
                workspace.currentUserRole === 'owner' &&
                member.role !== 'owner';
              const canRemove =
                member.role !== 'owner' &&
                member.userId !== currentUser?.id &&
                (workspace.currentUserRole === 'owner' ||
                  (workspace.currentUserRole === 'admin' &&
                    member.role === 'member'));

              return (
                <Box
                  key={member.id}
                  sx={{
                    px: { xs: 2, sm: 3 },
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <UserAvatar
                    name={member.user.name}
                    src={member.user.avatar}
                    size={38}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {member.user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {member.user.email}
                    </Typography>
                  </Box>

                  {canChangeRole ? (
                    <FormControl size="small" sx={{ minWidth: 138 }}>
                      <InputLabel id={`member-role-${member.id}`}>
                        {t('memberRole')}
                      </InputLabel>
                      <Select
                        labelId={`member-role-${member.id}`}
                        label={t('memberRole')}
                        value={member.role}
                        disabled={updateMemberRole.isPending}
                        onChange={(event) =>
                          updateMemberRole.mutate(
                            {
                              memberId: member.id,
                              role: event.target.value as 'admin' | 'member',
                            },
                            {
                              onSuccess: () =>
                                enqueueSnackbar(t('memberRoleUpdated'), {
                                  variant: 'success',
                                }),
                              onError: () =>
                                enqueueSnackbar(t('memberUpdateError'), {
                                  variant: 'error',
                                }),
                            },
                          )
                        }
                      >
                        <MenuItem value="admin">{t('role.admin')}</MenuItem>
                        <MenuItem value="member">{t('role.member')}</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip
                      icon={<Person />}
                      size="small"
                      variant="outlined"
                      label={t(`role.${member.role}`)}
                    />
                  )}

                  {canRemove && (
                    <Tooltip title={t('removeMember')}>
                      <IconButton
                        color="error"
                        aria-label={t('removeMember')}
                        onClick={() => setMemberToRemoveId(member.id)}
                      >
                        <DeleteOutlined />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              );
            })}
          </Stack>
        )}
      </Paper>

      {(workspace.currentUserRole === 'owner' ||
        workspace.currentUserRole === 'admin') && (
        <WorkspaceInvitesSection
          workspaceId={workspaceId}
          currentUserRole={workspace.currentUserRole}
        />
      )}

      {canDeleteWorkspace && (
        <Paper
          variant="outlined"
          sx={{
            borderColor: 'error.main',
            borderRadius: '6px',
            mt: 3,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ px: 3, py: 2.5 }}>
            <Typography
              variant="h6"
              color="error"
              sx={{ fontWeight: 600 }}
            >
              {t('dangerZoneTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('deleteWorkspaceDescription')}
            </Typography>
            <Button
              color="error"
              variant="outlined"
              startIcon={<DeleteOutlined />}
              onClick={() => setDeleteWorkspaceOpen(true)}
              sx={{ mt: 2 }}
            >
              {t('deleteWorkspace')}
            </Button>
          </Box>
        </Paper>
      )}

      <Dialog
        open={Boolean(memberToRemove)}
        onClose={() => {
          if (!removeMember.isPending) setMemberToRemoveId(null);
        }}
      >
        <DialogTitle>{t('removeMemberTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('removeMemberConfirm', {
              name: memberToRemove?.user.name ?? '',
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            disabled={removeMember.isPending}
            onClick={() => setMemberToRemoveId(null)}
          >
            {t('cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={!memberToRemove || removeMember.isPending}
            onClick={() => {
              if (!memberToRemove) return;

              removeMember.mutate(memberToRemove.id, {
                onSuccess: () => {
                  setMemberToRemoveId(null);
                  enqueueSnackbar(t('memberRemoved'), {
                    variant: 'success',
                  });
                },
                onError: () =>
                  enqueueSnackbar(t('memberRemoveError'), {
                    variant: 'error',
                  }),
              });
            }}
          >
            {removeMember.isPending ? t('removingMember') : t('removeMember')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isDeleteWorkspaceOpen}
        onClose={() => {
          if (!deleteWorkspace.isPending) setDeleteWorkspaceOpen(false);
        }}
      >
        <DialogTitle>{t('deleteWorkspaceTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('deleteWorkspaceConfirm', {
              name: workspace.name,
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            disabled={deleteWorkspace.isPending}
            onClick={() => setDeleteWorkspaceOpen(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteWorkspace.isPending}
            onClick={handleDeleteWorkspace}
          >
            {deleteWorkspace.isPending
              ? t('deletingWorkspace')
              : t('deleteWorkspace')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkspaceSettingsPage;
