'use client';

import type { Workspace } from '@/shared/api/api';
import { Business } from '@mui/icons-material';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';

interface WorkspaceSettingsHeaderProps {
  workspace: Workspace;
}

const WorkspaceSettingsHeader = ({
  workspace,
}: WorkspaceSettingsHeaderProps) => {
  const t = useTranslations('WorkspaceSettings');

  return (
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
  );
};

export default WorkspaceSettingsHeader;
