'use client';

import { useAuth } from '@/features/auth/useAuth';
import {
  clearPendingWorkspaceInvite,
  getInviteAuthHref,
  savePendingWorkspaceInvite,
} from '@/shared/lib/pending-workspace-invite';
import {
  useAcceptWorkspaceInvite,
  useWorkspaceInvitePreview,
} from '@/shared/queries/workspaces.queries';
import { useAuthStore } from '@/shared/store/root.store';
import { Business, Login, PersonAdd } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface Props {
  token: string;
}

const WorkspaceInviteLandingPage = ({ token }: Props) => {
  const t = useTranslations('WorkspaceInvite');
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const setActiveWorkspace = useAuthStore(
    (state) => state.setActiveWorkspace,
  );
  const preview = useWorkspaceInvitePreview(token);
  const acceptInvite = useAcceptWorkspaceInvite();

  useEffect(() => {
    if (isAuthLoading) return;
    if (user) {
      clearPendingWorkspaceInvite();
      return;
    }
    savePendingWorkspaceInvite(token);
  }, [isAuthLoading, token, user]);

  const handleAccept = () => {
    acceptInvite.mutate(token, {
      onSuccess: (workspace) => {
        setActiveWorkspace(workspace.id);
        clearPendingWorkspaceInvite();
        router.push('/boards');
        router.refresh();
      },
    });
  };

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100dvh - 56px)', sm: 'calc(100dvh - 64px)' },
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: 5,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 520 }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack
            spacing={3}
            sx={{ alignItems: 'center', textAlign: 'center' }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 3,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Business fontSize="large" />
            </Box>

            {preview.isLoading || isAuthLoading ? (
              <>
                <CircularProgress />
                <Typography color="text.secondary">
                  {t('loading')}
                </Typography>
              </>
            ) : preview.isError || !preview.data ? (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {t('unavailableTitle')}
                </Typography>
                <Alert severity="error">{t('unavailableDescription')}</Alert>
              </>
            ) : (
              <>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {preview.data.workspaceName}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {t('invitedBy', { name: preview.data.inviterName })}
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ flexWrap: 'wrap' }}
                >
                  <Chip
                    label={t(`role.${preview.data.defaultRole}`)}
                    color="primary"
                    variant="outlined"
                  />
                  {preview.data.emailRestricted && (
                    <Chip label={t('emailRestricted')} variant="outlined" />
                  )}
                </Stack>

                {acceptInvite.isError && (
                  <Alert severity="error" sx={{ width: '100%' }}>
                    {t('acceptError')}
                  </Alert>
                )}

                {user ? (
                  <Stack spacing={1.5} sx={{ width: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('signedInAs', { email: user.email })}
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleAccept}
                      disabled={acceptInvite.isPending}
                    >
                      {acceptInvite.isPending
                        ? t('accepting')
                        : t('accept')}
                    </Button>
                  </Stack>
                ) : (
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    sx={{ width: '100%' }}
                  >
                    <Button
                      component={Link}
                      href={getInviteAuthHref('/auth/login', token)}
                      variant="outlined"
                      startIcon={<Login />}
                      fullWidth
                    >
                      {t('login')}
                    </Button>
                    <Button
                      component={Link}
                      href={getInviteAuthHref('/auth/register', token)}
                      variant="contained"
                      startIcon={<PersonAdd />}
                      fullWidth
                    >
                      {t('register')}
                    </Button>
                  </Stack>
                )}
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WorkspaceInviteLandingPage;
