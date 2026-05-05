'use client';

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

const ProfilePage = () => {
  const sessionsQuery = useSessions();
  const revokeSession = useRevokeSession();

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Активные сессии
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Здесь вы можете увидеть свои устройства и завершить неиспользуемые сессии.
      </Typography>

      {sessionsQuery.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : sessionsQuery.isError ? (
        <Typography color="error" sx={{ mt: 3 }}>
          Не удалось загрузить сессии.
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
                      <Typography variant="subtitle1" fontWeight={600}>
                        {session.deviceName ?? 'Устройство'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {session.ipAddress ?? 'IP неизвестен'} •{' '}
                        {session.userAgent ?? 'браузер неизвестен'}
                      </Typography>
                    </Box>
                    <Chip
                      label={session.current ? 'Текущая сессия' : 'Не активна'}
                      color={session.current ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="body2" color="text.secondary">
                    Начало: {session.createdAt ?? '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Последняя активность: {session.updatedAt ?? '—'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    color="error"
                    disabled={session.current || revokeSession.isPending}
                    onClick={() => revokeSession.mutate(session.id)}
                  >
                    Завершить сессию
                  </Button>
                </CardActions>
              </Card>
            ))
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Активных сессий нет.
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default ProfilePage;
