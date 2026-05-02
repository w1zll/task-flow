'use client';

import { useBoard, useCreateColumn } from '@/shared/queries/boards.queries';
import { useBoardUIStore } from '@/shared/store/root.store';
import {
  Box,
  Breadcrumbs,
  Button,
  Link,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Add, ArrowBack } from '@mui/icons-material';
import NextLink from 'next/link';
import KanbanBoard from './KanbanBoard';
import TaskDetailModal from './TaskDetailModal';

interface Props {
  boardId: string;
}

const KanbanBoardPage = observer(({ boardId }: Props) => {
  const router = useRouter();
  const { data: board, isLoading, isError } = useBoard(boardId);
  const createColumn = useCreateColumn();
  const boardUI = useBoardUIStore();

  const [newColTitle, setNewColTitle] = useState('');

  const handleAddColumn = () => {
    const title = newColTitle.trim();
    if (!title) return;
    createColumn.mutate(
      { title, boardId },
      {
        onSuccess: () => {
          setNewColTitle('');
          boardUI.setAddingColumn(false);
        },
      },
    );
  };

  if (isError) {
    return (
      <Box sx={{bgcolor: 'background.default' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            gap: 2,
          }}
        >
          <Typography variant="h5" color="text.secondary">
            Доска не найдена
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => router.push('/boards')}
          >
            Назад к доскам
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >

      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}
        >
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
              <Typography variant="h6" fontWeight={700} noWrap>
                {board?.title}
              </Typography>
            )}
            <Breadcrumbs sx={{ fontSize: 12 }}>
              <Link
                component={NextLink}
                href="/boards"
                color="inherit"
                underline="hover"
                sx={{ fontSize: 12 }}
              >
                Доски
              </Link>
              <Typography color="text.primary" sx={{ fontSize: 12 }}>
                {board?.title}
              </Typography>
            </Breadcrumbs>
          </Box>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={() => boardUI.setAddingColumn(true)}
        >
          Добавить колонку
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', p: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" width={280} height={400} />
            ))}
          </Box>
        ) : board ? (
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start',
              minHeight: '100%',
            }}
          >
            <KanbanBoard board={board} />

            {boardUI.isAddingColumn ? (
              <Box
                sx={{
                  width: 280,
                  flexShrink: 0,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <TextField
                  autoFocus
                  size="small"
                  fullWidth
                  placeholder="Названи колонки"
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddColumn();
                    if (e.key === 'Escape') boardUI.setAddingColumn(false);
                  }}
                  sx={{ mb: 1 }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleAddColumn}
                    disabled={createColumn.isPending}
                  >
                    Добавить
                  </Button>
                  <Button
                    size="small"
                    onClick={() => boardUI.setAddingColumn(false)}
                  >
                    Отмена
                  </Button>
                </Box>
              </Box>
            ) : null}
          </Box>
        ) : null}
      </Box>

      {board && <TaskDetailModal board={board} />}
    </Box>
  );
});

export default KanbanBoardPage;
