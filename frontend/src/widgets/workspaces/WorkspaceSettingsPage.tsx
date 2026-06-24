'use client';

import {
  useWorkspaceMembers,
  useWorkspaces,
} from '@/shared/queries/workspaces.queries';
import UserAvatar from '@/shared/ui/UserAvatar';
import { ArrowBack, Business, Person } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface Props {
  workspaceId: string;
}

const WorkspaceSettingsPage = ({ workspaceId }: Props) => {
  const t = useTranslations('WorkspaceSettings');
  const workspaces = useWorkspaces();
  const members = useWorkspaceMembers(workspaceId);
  const workspace = workspaces.data?.find((item) => item.id === workspaceId);

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
      <Button
        component={Link}
        href="/boards"
        startIcon={<ArrowBack />}
        sx={{ mb: 2 }}
      >
        {t('back')}
      </Button>

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
            borderRadius: 2,
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

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
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
            {members.data?.map((member) => (
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
                <Chip
                  icon={<Person />}
                  size="small"
                  variant="outlined"
                  label={t(`role.${member.role}`)}
                />
              </Box>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
};

export default WorkspaceSettingsPage;
