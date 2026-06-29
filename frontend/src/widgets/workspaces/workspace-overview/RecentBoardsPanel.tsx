'use client';

import type { Board } from '@/shared/api/api';
import { Add, OpenInNew } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface RecentBoardsPanelProps {
  workspaceId: string;
  boards: Board[];
  isLoading: boolean;
}

const RecentBoardsPanel = ({
  workspaceId,
  boards,
  isLoading,
}: RecentBoardsPanelProps) => {
  const t = useTranslations('WorkspaceOverview');
  const shellT = useTranslations('WorkspaceShell');

  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: 'space-between', mb: 2 }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('recentBoards')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('recentBoardsDescription')}
          </Typography>
        </Box>
        <Button
          component={Link}
          href={`/workspaces/${workspaceId}/boards`}
          size="small"
          endIcon={<OpenInNew />}
        >
          {t('allBoards')}
        </Button>
      </Stack>

      {isLoading ? (
        <Stack spacing={1}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={68} />
          ))}
        </Stack>
      ) : boards.length ? (
        <Stack spacing={1}>
          {boards.slice(0, 4).map((board) => (
            <Card key={board.id} variant="outlined">
              <CardActionArea
                component={Link}
                href={`/workspaces/${workspaceId}/boards/${board.id}`}
                sx={{ p: 1.5 }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: board.color,
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 700 }} noWrap>
                      {board.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {board.description || t('noDescription')}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={shellT(`boardRole.${board.currentUserRole}`)}
                  />
                </Stack>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      ) : (
        <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <Typography color="text.secondary">{t('emptyBoards')}</Typography>
          <Button
            component={Link}
            href={`/workspaces/${workspaceId}/boards`}
            startIcon={<Add />}
            variant="contained"
          >
            {t('createFirstBoard')}
          </Button>
        </Stack>
      )}
    </Paper>
  );
};

export default RecentBoardsPanel;
