'use client';

import type { Board } from '@/shared/api/api';
import { MoreVert, ViewKanban } from '@mui/icons-material';
import {
  Box,
  Card,
  CardActionArea,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface BoardCardProps {
  board: Board;
  onOpenMenu: (anchor: HTMLElement, board: Board) => void;
}

const BoardCard = ({ board, onOpenMenu }: BoardCardProps) => {
  const t = useTranslations('Boards');

  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Card
        sx={{
          height: 160,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            bgcolor: board.color,
          },
        }}
      >
        <CardActionArea
          component={Link}
          href={`/workspaces/${board.workspaceId}/boards/${board.id}`}
          sx={{
            height: '100%',
            p: 2.5,
            pt: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ width: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <Typography
                variant="h6"
                sx={{ lineHeight: 1.3, flex: 1, fontWeight: 600 }}
              >
                {board.title}
              </Typography>
              {board.capabilities.canDeleteBoard && (
                <IconButton
                  size="small"
                  aria-label={t('boardActions', { title: board.title })}
                  aria-haspopup="menu"
                  sx={{ ml: 1, mt: -0.5 }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onOpenMenu(event.currentTarget, board);
                  }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              )}
            </Box>
            {board.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {board.description}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
            }}
          >
            <ViewKanban sx={{ fontSize: 16, color: board.color }} />
            <Typography variant="caption" color="text.secondary">
              {new Date(board.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </CardActionArea>
      </Card>
    </Grid>
  );
};

export default BoardCard;
