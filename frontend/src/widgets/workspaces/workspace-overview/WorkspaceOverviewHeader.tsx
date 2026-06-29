'use client';

import type { Workspace } from '@/shared/api/api';
import { Business, ViewKanbanOutlined } from '@mui/icons-material';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface WorkspaceOverviewHeaderProps {
  workspace?: Workspace;
  workspaceId: string;
}

const WorkspaceOverviewHeader = ({
  workspace,
  workspaceId,
}: WorkspaceOverviewHeaderProps) => {
  const t = useTranslations('WorkspaceOverview');
  const shellT = useTranslations('WorkspaceShell');

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{ justifyContent: 'space-between', mb: 3 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 44,
              height: 44,
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
            <Typography variant="h4" sx={{ fontWeight: 800 }} noWrap>
              {workspace?.name ?? t('loading')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('subtitle')}
            </Typography>
          </Box>
        </Stack>
        {workspace && (
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Chip
              size="small"
              label={shellT(`role.${workspace.currentUserRole}`)}
            />
            {workspace.isPersonal && (
              <Chip
                size="small"
                variant="outlined"
                label={shellT('personal')}
              />
            )}
          </Stack>
        )}
      </Box>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Button
          component={Link}
          href={`/workspaces/${workspaceId}/boards`}
          variant="contained"
          startIcon={<ViewKanbanOutlined />}
        >
          {t('openBoards')}
        </Button>
        <Button
          component={Link}
          href={`/workspaces/${workspaceId}/settings`}
          variant="outlined"
        >
          {t('settings')}
        </Button>
      </Stack>
    </Stack>
  );
};

export default WorkspaceOverviewHeader;
