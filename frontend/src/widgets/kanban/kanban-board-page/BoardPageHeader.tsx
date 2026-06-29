'use client';

import type { Board } from '@/shared/api/api';
import {
  Add,
  GroupOutlined,
  LockOutlined,
  QueryStats,
} from '@mui/icons-material';
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Link,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';

interface BoardPageHeaderProps {
  board?: Board;
  isLoading: boolean;
  canManageColumns: boolean;
  canEditBoardContent: boolean;
  isStatsOpen: boolean;
  isMembersOpen: boolean;
  onAddColumn: () => void;
  onToggleStats: () => void;
  onToggleMembers: () => void;
}

const BoardPageHeader = ({
  board,
  isLoading,
  canManageColumns,
  canEditBoardContent,
  isStatsOpen,
  isMembersOpen,
  onAddColumn,
  onToggleStats,
  onToggleMembers,
}: BoardPageHeaderProps) => {
  const t = useTranslations('BoardPage');

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3 },
        py: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
        gap: 2,
        bgcolor: 'background.paper',
        flexShrink: 0,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
        {board && (
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              bgcolor: board.color,
              flexShrink: 0,
            }}
          />
        )}
        <Box sx={{ minWidth: 0 }}>
          {isLoading ? (
            <Skeleton width={200} height={32} />
          ) : (
            <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
              {board?.title}
            </Typography>
          )}
          <Breadcrumbs sx={{ fontSize: 12 }}>
            <Link
              component={NextLink}
              href={
                board?.workspaceId
                  ? `/workspaces/${board.workspaceId}/boards`
                  : '/workspaces'
              }
              color="inherit"
              underline="hover"
              sx={{ fontSize: 12 }}
            >
              {t('boardsLink')}
            </Link>
            <Typography color="text.primary" sx={{ fontSize: 12 }}>
              {board?.title}
            </Typography>
          </Breadcrumbs>
        </Box>
        {canManageColumns ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={onAddColumn}
            sx={{ flexShrink: 0 }}
          >
            {t('addColumn')}
          </Button>
        ) : board && !canEditBoardContent ? (
          <Chip
            size="small"
            icon={<LockOutlined />}
            label={t('readOnly')}
            variant="outlined"
          />
        ) : null}
      </Box>

      <Stack direction="row" spacing={1}>
        <Button
          variant={isStatsOpen ? 'contained' : 'outlined'}
          size="small"
          startIcon={<QueryStats />}
          onClick={onToggleStats}
        >
          {t('stats')}
        </Button>
        <Button
          variant={isMembersOpen ? 'contained' : 'outlined'}
          size="small"
          startIcon={<GroupOutlined />}
          onClick={onToggleMembers}
        >
          {t('members')}
        </Button>
      </Stack>
    </Box>
  );
};

export default BoardPageHeader;
