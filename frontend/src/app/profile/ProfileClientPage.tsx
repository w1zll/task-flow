'use client';

import { useTranslations } from 'next-intl';
import { useRevokeSession, useSessions } from '@/shared/queries/auth.queries';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material';

const ProfileClientPage = () => {
  const t = useTranslations('ProfilePage');
  const sessionsQuery = useSessions();
  const revokeSession = useRevokeSession();

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
        {t('title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {t('description')}
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
