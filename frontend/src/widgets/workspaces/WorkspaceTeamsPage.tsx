'use client';

import { useWorkspaces } from '@/shared/queries/workspaces.queries';
import { Box, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import WorkspaceTeamsSection from './WorkspaceTeamsSection';

interface Props {
  workspaceId: string;
}

const WorkspaceTeamsPage = ({ workspaceId }: Props) => {
  const t = useTranslations('WorkspaceTeamsPage');
  const { data: workspaces = [] } = useWorkspaces();
  const workspace = workspaces.find((item) => item.id === workspaceId);
  const canManage =
    workspace?.currentUserRole === 'owner' ||
    workspace?.currentUserRole === 'admin';

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        {t('title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {t('description')}
      </Typography>
      <WorkspaceTeamsSection
        workspaceId={workspaceId}
        canManage={canManage}
      />
    </Box>
  );
};

export default WorkspaceTeamsPage;
