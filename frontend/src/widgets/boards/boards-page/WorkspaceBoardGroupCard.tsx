'use client';

import type { Board, Workspace } from '@/shared/api/api';
import { Add, Business, Delete } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import BoardCard from './BoardCard';

interface WorkspaceBoardGroupCardProps {
  workspace: Workspace;
  boards: Board[];
  onCreateBoard: (workspaceId: string) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onOpenBoardMenu: (anchor: HTMLElement, board: Board) => void;
}

const WorkspaceBoardGroupCard = ({
  workspace,
  boards,
  onCreateBoard,
  onDeleteWorkspace,
  onOpenBoardMenu,
}: WorkspaceBoardGroupCardProps) => {
  const t = useTranslations('Boards');

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box
        sx={{
          color: 'inherit',
          textDecoration: 'none',
          px: { xs: 2, sm: 3 },
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          transition: 'background-color 0.2s ease',
          ':hover': { bgcolor: 'action.hover' },
        }}
        component={Link}
        href={`/workspaces/${workspace.id}`}
      >
        <Stack
          direction="row"
          spacing={1.25}
          sx={{ alignItems: 'center', minWidth: 0 }}
        >
          <Business color="action" />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
              {workspace.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {workspace.isPersonal
                ? t('personalWorkspace')
                : t(`role.${workspace.currentUserRole}`)}
            </Typography>
          </Box>
        </Stack>
        <Chip size="small" label={t('boardsCount', { count: boards.length })} />
        {workspace.currentUserRole === 'owner' && (
          <Tooltip title={t('deleteWorkspace')}>
            <IconButton
              color="error"
              aria-label={t('deleteWorkspace')}
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                onDeleteWorkspace(workspace.id);
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Divider />
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {boards.length ? (
          <Grid container spacing={2}>
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onOpenMenu={onOpenBoardMenu}
              />
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('emptyWorkspaceTitle')}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Add />}
              onClick={() => onCreateBoard(workspace.id)}
            >
              {t('emptyAction')}
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default WorkspaceBoardGroupCard;
