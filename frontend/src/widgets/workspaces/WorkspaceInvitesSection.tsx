'use client';

import { useStableBodyScrollLock } from '@/shared/lib/useStableBodyScrollLock';
import {
  useCreateWorkspaceInvite,
  useRevokeWorkspaceInvite,
  useWorkspaceInvites,
} from '@/shared/queries/workspaces.queries';
import { AddLink, ContentCopy, LinkOff } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useFormatter, useTranslations } from 'next-intl';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

interface Props {
  workspaceId: string;
  currentUserRole: 'owner' | 'admin';
}

interface InviteForm {
  defaultRole: 'member' | 'admin';
  expiresInDays: string;
  maxUses: string;
  allowedEmail: string;
  allowedEmailDomain: string;
}

const initialForm: InviteForm = {
  defaultRole: 'member',
  expiresInDays: '7',
  maxUses: '',
  allowedEmail: '',
  allowedEmailDomain: '',
};

const WorkspaceInvitesSection = ({
  workspaceId,
  currentUserRole,
}: Props) => {
  const t = useTranslations('WorkspaceInvites');
  const format = useFormatter();
  const { enqueueSnackbar } = useSnackbar();
  const invites = useWorkspaceInvites(workspaceId);
  const createInvite = useCreateWorkspaceInvite(workspaceId);
  const revokeInvite = useRevokeWorkspaceInvite(workspaceId);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [createdLink, setCreatedLink] = useState('');

  useStableBodyScrollLock(isCreateOpen);

  const updateForm = <K extends keyof InviteForm>(
    key: K,
    value: InviteForm[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const handleCreate = () => {
    createInvite.mutate(
      {
        defaultRole: form.defaultRole,
        expiresInDays: Number(form.expiresInDays),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        allowedEmail: form.allowedEmail.trim() || null,
        allowedEmailDomain: form.allowedEmailDomain.trim() || null,
      },
      {
        onSuccess: (invite) => {
          const link = `${window.location.origin}/invite/${invite.token}`;
          setCreatedLink(link);
          setForm(initialForm);
        },
        onError: () =>
          enqueueSnackbar(t('createError'), { variant: 'error' }),
      },
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(createdLink);
      enqueueSnackbar(t('copied'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('copyError'), { variant: 'error' });
    }
  };

  const closeDialog = () => {
    if (createInvite.isPending) return;
    setCreateOpen(false);
    setCreatedLink('');
    setForm(initialForm);
  };

  return (
    <>
      <Paper variant="outlined" sx={{ borderRadius: 2, mt: 3 }}>
        <Box
          sx={{
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
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
          <Button
            variant="contained"
            startIcon={<AddLink />}
            onClick={() => setCreateOpen(true)}
          >
            {t('create')}
          </Button>
        </Box>
        <Divider />

        {invites.isLoading ? (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            {t('loading')}
          </Typography>
        ) : invites.isError ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {t('loadError')}
          </Alert>
        ) : invites.data?.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            {t('empty')}
          </Typography>
        ) : (
          <Stack divider={<Divider flexItem />}>
            {invites.data?.map((invite) => (
              <Box
                key={invite.id}
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    sx={{ flexWrap: 'wrap' }}
                  >
                    <Chip
                      size="small"
                      label={t(`role.${invite.defaultRole}`)}
                    />
                    {invite.allowedEmailDomain && (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`@${invite.allowedEmailDomain}`}
                      />
                    )}
                    {invite.hasSpecificEmailRestriction && (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={t('specificEmail')}
                      />
                    )}
                  </Stack>
                  <Typography variant="body2" sx={{ mt: 0.75 }}>
                    {t('usage', {
                      used: invite.usesCount,
                      max: invite.maxUses ?? t('unlimited'),
                    })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('expires', {
                      date: format.dateTime(new Date(invite.expiresAt), {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }),
                    })}
                  </Typography>
                </Box>
                <Tooltip title={t('revoke')}>
                  <IconButton
                    color="error"
                    onClick={() =>
                      revokeInvite.mutate(invite.id, {
                        onError: () =>
                          enqueueSnackbar(t('revokeError'), {
                            variant: 'error',
                          }),
                      })
                    }
                    disabled={revokeInvite.isPending}
                  >
                    <LinkOff />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      <Dialog
        open={isCreateOpen}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('dialogTitle')}</DialogTitle>
        <DialogContent
          sx={{
            pt: '12px !important',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {createdLink ? (
            <>
              <Alert severity="success">{t('createdDescription')}</Alert>
              <TextField
                label={t('link')}
                value={createdLink}
                fullWidth
                slotProps={{ htmlInput: { readOnly: true } }}
              />
              <Button
                variant="contained"
                startIcon={<ContentCopy />}
                onClick={copyLink}
              >
                {t('copy')}
              </Button>
            </>
          ) : (
            <>
              <TextField
                select
                label={t('defaultRole')}
                value={form.defaultRole}
                onChange={(event) =>
                  updateForm(
                    'defaultRole',
                    event.target.value as InviteForm['defaultRole'],
                  )
                }
              >
                <MenuItem value="member">{t('role.member')}</MenuItem>
                {currentUserRole === 'owner' && (
                  <MenuItem value="admin">{t('role.admin')}</MenuItem>
                )}
              </TextField>
              <TextField
                label={t('expiresInDays')}
                type="number"
                value={form.expiresInDays}
                onChange={(event) =>
                  updateForm('expiresInDays', event.target.value)
                }
                slotProps={{ htmlInput: { min: 1, max: 30 } }}
              />
              <TextField
                label={t('maxUses')}
                type="number"
                value={form.maxUses}
                onChange={(event) =>
                  updateForm('maxUses', event.target.value)
                }
                helperText={t('maxUsesHint')}
                slotProps={{ htmlInput: { min: 1, max: 1000 } }}
              />
              <TextField
                label={t('allowedEmail')}
                type="email"
                value={form.allowedEmail}
                onChange={(event) =>
                  updateForm('allowedEmail', event.target.value)
                }
                helperText={t('allowedEmailHint')}
              />
              <TextField
                label={t('allowedDomain')}
                placeholder="example.com"
                value={form.allowedEmailDomain}
                onChange={(event) =>
                  updateForm('allowedEmailDomain', event.target.value)
                }
                helperText={t('allowedDomainHint')}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog}>
            {createdLink ? t('done') : t('cancel')}
          </Button>
          {!createdLink && (
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={
                createInvite.isPending ||
                Number(form.expiresInDays) < 1 ||
                Number(form.expiresInDays) > 30
              }
            >
              {createInvite.isPending ? t('creating') : t('createAction')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WorkspaceInvitesSection;
