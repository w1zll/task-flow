'use client';

import type { Board } from '@/shared/api/api';
import {
  Add,
  GroupOutlined,
  HistoryOutlined,
  LockOutlined,
  QueryStats,
} from '@mui/icons-material';
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  IconButton,
  Link,
  Skeleton,
  Stack,
  Tooltip,
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
  isActivityOpen: boolean;
  onAddColumn: () => void;
  onToggleStats: () => void;
  onToggleMembers: () => void;
  onToggleActivity: () => void;
}

const BoardPageHeader = ({
  board,
  isLoading,
  canManageColumns,
  canEditBoardContent,
  isStatsOpen,
  isMembersOpen,
  isActivityOpen,
  onAddColumn,
  onToggleStats,
  onToggleMembers,
  onToggleActivity,
}: BoardPageHeaderProps) => {
  const t = useTranslations('BoardPage');

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3 },
        py: { xs: .5, sm: 2 },
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
          <>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Add />}
              onClick={onAddColumn}
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                flexShrink: 0,
              }}
            >
              {t('addColumn')}
            </Button>
            <Tooltip title={t('addColumn')}>
              <IconButton
                size="small"
                onClick={onAddColumn}
                aria-label={t('addColumn')}
                sx={{
                  display: { xs: 'inline-flex', sm: 'none' },
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                }}
              >
                <Add fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        ) : board && !canEditBoardContent ? (
          <Chip
            size="small"
            icon={<LockOutlined />}
            label={t('readOnly')}
            variant="outlined"
          />
        ) : null}
      </Box>

      <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
        <Button
          variant={isStatsOpen ? 'contained' : 'outlined'}
          size="small"
          startIcon={<QueryStats />}
          onClick={onToggleStats}
          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
        >
          {t('stats')}
        </Button>
        <Tooltip title={t('stats')}>
          <IconButton
            size="small"
            color={isStatsOpen ? 'primary' : 'default'}
            onClick={onToggleStats}
            aria-label={t('stats')}
            sx={{
              display: { xs: 'inline-flex', sm: 'none' },
              width: 44,
              height: 44,
            }}
          >
            <QueryStats fontSize="small" />
          </IconButton>
        </Tooltip>
        <Button
          variant={isActivityOpen ? 'contained' : 'outlined'}
          size="small"
          startIcon={<HistoryOutlined />}
          onClick={onToggleActivity}
          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
        >
          {t('activity')}
        </Button>
        <Tooltip title={t('activity')}>
          <IconButton
            size="small"
            color={isActivityOpen ? 'primary' : 'default'}
            onClick={onToggleActivity}
            aria-label={t('activity')}
            sx={{
              display: { xs: 'inline-flex', sm: 'none' },
              width: 44,
              height: 44,
            }}
          >
            <HistoryOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Button
          variant={isMembersOpen ? 'contained' : 'outlined'}
          size="small"
          startIcon={<GroupOutlined />}
          onClick={onToggleMembers}
          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
        >
          {t('members')}
        </Button>
        <Tooltip title={t('members')}>
          <IconButton
            size="small"
            color={isMembersOpen ? 'primary' : 'default'}
            onClick={onToggleMembers}
            aria-label={t('members')}
            sx={{
              display: { xs: 'inline-flex', sm: 'none' },
              width: 44,
              height: 44,
            }}
          >
            <GroupOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default BoardPageHeader;
