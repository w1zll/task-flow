'use client';

import { Team } from '@/shared/api/api';
import {
  useAddTeamMember,
  useCreateTeam,
  useDeleteTeam,
  useRemoveTeamMember,
  useUpdateTeam,
  useWorkspaceTeams,
} from '@/shared/queries/teams.queries';
import { useWorkspaceMembers } from '@/shared/queries/workspaces.queries';
import UserAvatar from '@/shared/ui/UserAvatar';
import {
  Add,
  DeleteOutlined,
  EditOutlined,
  GroupsOutlined,
  PersonAddAltOutlined,
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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';

interface Props {
  workspaceId: string;
  canManage: boolean;
}

const initialForm = {
  name: '',
  description: '',
  color: '#6366f1',
};

const WorkspaceTeamsSection = ({ workspaceId, canManage }: Props) => {
  const t = useTranslations('WorkspaceTeams');
  const { enqueueSnackbar } = useSnackbar();
  const teams = useWorkspaceTeams(workspaceId);
  const workspaceMembers = useWorkspaceMembers(workspaceId);
  const createTeam = useCreateTeam(workspaceId);
  const updateTeam = useUpdateTeam(workspaceId);
  const deleteTeam = useDeleteTeam(workspaceId);
  const addMember = useAddTeamMember(workspaceId);
  const removeMember = useRemoveTeamMember(workspaceId);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [managedTeamId, setManagedTeamId] = useState<string | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [form, setForm] = useState(initialForm);

  const managedTeam = teams.data?.find((team) => team.id === managedTeamId);
  const availableMembers = useMemo(() => {
    const assigned = new Set(
      managedTeam?.members.map((member) => member.userId) ?? [],
    );
    return (
      workspaceMembers.data?.filter(
        (member) => !assigned.has(member.userId),
      ) ?? []
    );
  }, [managedTeam?.members, workspaceMembers.data]);

  const openCreate = () => {
    setEditingTeam(null);
    setForm(initialForm);
    setEditorOpen(true);
  };

  const openEdit = (team: Team) => {
    setEditingTeam(team);
    setForm({
      name: team.name,
      description: team.description ?? '',
      color: team.color,
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (createTeam.isPending || updateTeam.isPending) return;
    setEditorOpen(false);
  };

  const saveTeam = () => {
    const name = form.name.trim();
    if (!name) return;
    const data = {
      name,
      description: form.description.trim() || undefined,
      color: form.color,
    };
    const options = {
      onSuccess: () => {
        setEditorOpen(false);
        enqueueSnackbar(
          t(editingTeam ? 'updated' : 'created'),
          { variant: 'success' },
        );
      },
      onError: () =>
        enqueueSnackbar(t('saveError'), { variant: 'error' }),
    };

    if (editingTeam) {
      updateTeam.mutate({ teamId: editingTeam.id, data }, options);
    } else {
      createTeam.mutate(data, options);
    }
  };

  return (
    <>
      <Paper
        variant="outlined"
        sx={{ borderRadius: 2, overflow: 'hidden', mt: 3 }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('description')}
            </Typography>
          </Box>
          {canManage && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreate}
              sx={{ flexShrink: 0 }}
            >
              {t('create')}
            </Button>
          )}
        </Box>
        <Divider />

        {teams.isLoading ? (
          <Stack spacing={1.5} sx={{ p: 3 }}>
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={112} />
            ))}
          </Stack>
        ) : teams.isError ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {t('loadError')}
          </Alert>
        ) : teams.data?.length ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
              },
              gap: 2,
              p: 3,
            }}
          >
            {teams.data.map((team) => (
              <Paper
                key={team.id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderLeft: '4px solid',
                  borderLeftColor: team.color,
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'flex-start' }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {team.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ minHeight: 20 }}
                    >
                      {team.description || t('noDescription')}
                    </Typography>
                  </Box>
                  {canManage && (
                    <>
                      <Tooltip title={t('edit')}>
                        <IconButton size="small" onClick={() => openEdit(team)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('delete')}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setTeamToDelete(team)}
                        >
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 2, alignItems: 'center' }}
                >
                  <GroupsOutlined color="action" fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    {t('memberCount', { count: team.members.length })}
                  </Typography>
                  <Box sx={{ display: 'flex', flex: 1, minWidth: 0 }}>
                    {team.members.slice(0, 4).map((member, index) => (
                      <Tooltip key={member.id} title={member.user.name}>
                        <Box sx={{ ml: index === 0 ? 0 : -0.6 }}>
                          <UserAvatar
                            name={member.user.name}
                            src={member.user.avatar}
                            size={26}
                          />
                        </Box>
                      </Tooltip>
                    ))}
                  </Box>
                  <Button
                    size="small"
                    onClick={() => {
                      setManagedTeamId(team.id);
                      setSelectedUserId('');
                    }}
                  >
                    {canManage ? t('manageMembers') : t('viewMembers')}
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Box>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <GroupsOutlined sx={{ fontSize: 38, color: 'text.disabled' }} />
            <Typography sx={{ mt: 1, fontWeight: 600 }}>
              {t('emptyTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('emptyDescription')}
            </Typography>
          </Box>
        )}
      </Paper>

      <Dialog open={isEditorOpen} onClose={closeEditor} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTeam ? t('editTitle') : t('createTitle')}
        </DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
          <TextField
            autoFocus
            label={t('name')}
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            slotProps={{ htmlInput: { maxLength: 120 } }}
          />
          <TextField
            label={t('teamDescription')}
            multiline
            minRows={3}
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            slotProps={{ htmlInput: { maxLength: 1000 } }}
          />
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <TextField
              label={t('color')}
              type="color"
              value={form.color}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  color: event.target.value,
                }))
              }
              sx={{ width: 100 }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Chip
              label={form.name.trim() || t('preview')}
              sx={{ bgcolor: form.color, color: '#fff', fontWeight: 600 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditor}>{t('cancel')}</Button>
          <Button
            variant="contained"
            onClick={saveTeam}
            disabled={
              !form.name.trim() ||
              createTeam.isPending ||
              updateTeam.isPending
            }
          >
            {createTeam.isPending || updateTeam.isPending
              ? t('saving')
              : t('save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(managedTeam)}
        onClose={() => {
          if (!addMember.isPending && !removeMember.isPending) {
            setManagedTeamId(null);
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t('membersTitle', { team: managedTeam?.name ?? '' })}
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          {canManage && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t('addMember')}</InputLabel>
                <Select
                  label={t('addMember')}
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                >
                  {availableMembers.map((member) => (
                    <MenuItem key={member.id} value={member.userId}>
                      {member.user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<PersonAddAltOutlined />}
                disabled={!selectedUserId || addMember.isPending}
                onClick={() => {
                  if (!managedTeam || !selectedUserId) return;
                  addMember.mutate(
                    { teamId: managedTeam.id, userId: selectedUserId },
                    {
                      onSuccess: () => {
                        setSelectedUserId('');
                        enqueueSnackbar(t('memberAdded'), {
                          variant: 'success',
                        });
                      },
                      onError: () =>
                        enqueueSnackbar(t('memberError'), {
                          variant: 'error',
                        }),
                    },
                  );
                }}
                sx={{ flexShrink: 0 }}
              >
                {t('add')}
              </Button>
            </Stack>
          )}

          <Stack divider={<Divider flexItem />}>
            {managedTeam?.members.length ? (
              managedTeam.members.map((member) => (
                <Stack
                  key={member.id}
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: 'center', py: 1.25 }}
                >
                  <UserAvatar
                    name={member.user.name}
                    src={member.user.avatar}
                    size={34}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {member.user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {member.user.email}
                    </Typography>
                  </Box>
                  {canManage && (
                    <Tooltip title={t('removeMember')}>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={removeMember.isPending}
                        onClick={() =>
                          removeMember.mutate(
                            { teamId: managedTeam.id, memberId: member.id },
                            {
                              onError: () =>
                                enqueueSnackbar(t('memberError'), {
                                  variant: 'error',
                                }),
                            },
                          )
                        }
                      >
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                {t('noMembers')}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManagedTeamId(null)}>{t('close')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(teamToDelete)}
        onClose={() => {
          if (!deleteTeam.isPending) setTeamToDelete(null);
        }}
      >
        <DialogTitle>{t('deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('deleteConfirm', { team: teamToDelete?.name ?? '' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamToDelete(null)}>{t('cancel')}</Button>
          <Button
            color="error"
            variant="contained"
            disabled={!teamToDelete || deleteTeam.isPending}
            onClick={() => {
              if (!teamToDelete) return;
              deleteTeam.mutate(teamToDelete.id, {
                onSuccess: () => {
                  setTeamToDelete(null);
                  enqueueSnackbar(t('deleted'), { variant: 'success' });
                },
                onError: () =>
                  enqueueSnackbar(t('deleteError'), { variant: 'error' }),
              });
            }}
          >
            {deleteTeam.isPending ? t('deleting') : t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WorkspaceTeamsSection;
