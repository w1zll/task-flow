'use client';

import { useTranslations } from 'next-intl';
import {
  useResetAvatar,
  useRevokeSession,
  useSessions,
  useUpdateAvatar,
} from '@/shared/queries/auth.queries';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { PhotoCamera, RestartAlt } from '@mui/icons-material';
import { useAuth } from '@/features/auth/useAuth';
import UserAvatar from '@/shared/ui/UserAvatar';
import {
  AVATAR_ACCEPT,
  validateAvatarFile,
} from '@/shared/lib/avatar';
import { useSnackbar } from 'notistack';

const ProfileClientPage = () => {
  const t = useTranslations('ProfilePage');
  const { user, isLoading: isAuthLoading } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const sessionsQuery = useSessions();
  const revokeSession = useRevokeSession();
  const updateAvatar = useUpdateAvatar();
  const resetAvatar = useResetAvatar();
  const isAvatarPending = updateAvatar.isPending || resetAvatar.isPending;

  const handleAvatarChange = (file?: File) => {
    if (!file) return;
    const validationError = validateAvatarFile(file);
    if (validationError) {
      enqueueSnackbar(t(`avatarError.${validationError}`), {
        variant: 'error',
      });
      return;
    }

    updateAvatar.mutate(file, {
      onSuccess: () =>
        enqueueSnackbar(t('avatarUpdated'), { variant: 'success' }),
      onError: (error: any) =>
        enqueueSnackbar(
          error.response?.data?.message ?? t('avatarUpdateError'),
          { variant: 'error' },
        ),
    });
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
        {t('profileTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {t('profileDescription')}
      </Typography>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t('avatarTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('avatarDescription')}
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}
          >
            {isAuthLoading ? (
              <Skeleton variant="circular" width={80} height={80} />
            ) : (
              <UserAvatar name={user?.name} src={user?.avatar} size={80} />
            )}
            <Box>
              {isAuthLoading ? (
                <>
                  <Skeleton width={160} />
                  <Skeleton width={220} />
                </>
              ) : (
                <>
                  <Typography sx={{ fontWeight: 600 }}>{user?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                </>
              )}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ mt: 1.5 }}
              >
                <Button
                  component="label"
                  variant="contained"
                  size="small"
                  startIcon={<PhotoCamera />}
                  disabled={isAuthLoading || isAvatarPending}
                >
                  {updateAvatar.isPending ? t('avatarSaving') : t('changeAvatar')}
                  <input
                    hidden
                    type="file"
                    accept={AVATAR_ACCEPT}
                    onChange={(event) => {
                      handleAvatarChange(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RestartAlt />}
                  disabled={isAuthLoading || isAvatarPending}
                  onClick={() =>
                    resetAvatar.mutate(undefined, {
                      onSuccess: () =>
                        enqueueSnackbar(t('avatarReset'), {
                          variant: 'success',
                        }),
                      onError: () =>
                        enqueueSnackbar(t('avatarUpdateError'), {
                          variant: 'error',
                        }),
                    })
                  }
                >
                  {t('resetAvatar')}
                </Button>
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 1 }}
              >
                {t('avatarHint')}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ fontWeight: 700, mt: 4 }} gutterBottom>
        {t('sessionsTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {t('sessionsDescription')}
      </Typography>

      {sessionsQuery.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : sessionsQuery.isError ? (
        <Typography color="error" sx={{ mt: 3 }}>
          {t('loadingError')}
        </Typography>
      ) : (
        <Stack spacing={2} sx={{ mt: 2 }}>
          {sessionsQuery.data?.length ? (
            sessionsQuery.data.map((session: any) => (
              <Card key={session.id}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {session.deviceName ?? t('deviceFallback')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {session.ipAddress ?? t('ipUnknown')} -{' '}
                        {session.userAgent ?? t('browserUnknown')}
                      </Typography>
                    </Box>
                    <Chip
                      label={
                        session.current ? t('currentSession') : t('inactive')
                      }
                      color={session.current ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="body2" color="text.secondary">
                    {t('startedAt')}: {session.createdAt ?? '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('lastActive')}: {session.updatedAt ?? '-'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    color="error"
                    disabled={session.current || revokeSession.isPending}
                    onClick={() => revokeSession.mutate(session.id)}
                  >
                    {t('endSession')}
                  </Button>
                </CardActions>
              </Card>
            ))
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              {t('noSessions')}
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default ProfileClientPage;
