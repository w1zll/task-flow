'use client';

import type { Board } from '@/shared/api/api';
import { Box, Skeleton } from '@mui/material';
import type { RefObject } from 'react';
import KanbanBoard from '../KanbanBoard';
import AddColumnComposer from './AddColumnComposer';
import { subtleScrollbarSx } from './scrollbarSx';

interface BoardCanvasSectionProps {
  boardId: string;
  isLoading: boolean;
  filteredBoard?: Board;
  highlightedTaskId?: string | null;
  isReorderDisabled: boolean;
  canManageColumns: boolean;
  isAddingColumn: boolean;
  newColumnTitle: string;
  isCreatingColumn: boolean;
  boardScrollWidth: number;
  hasBoardHorizontalOverflow: boolean;
  boardScrollRef: RefObject<HTMLDivElement | null>;
  boardTopScrollRef: RefObject<HTMLDivElement | null>;
  boardContentRef: RefObject<HTMLDivElement | null>;
  onBoardScroll: () => void;
  onTopScroll: () => void;
  onNewColumnTitleChange: (title: string) => void;
  onAddColumn: () => void;
  onCancelAddColumn: () => void;
}

const BoardCanvasSection = ({
  boardId,
  isLoading,
  filteredBoard,
  highlightedTaskId,
  isReorderDisabled,
  canManageColumns,
  isAddingColumn,
  newColumnTitle,
  isCreatingColumn,
  boardScrollWidth,
  hasBoardHorizontalOverflow,
  boardScrollRef,
  boardTopScrollRef,
  boardContentRef,
  onBoardScroll,
  onTopScroll,
  onNewColumnTitleChange,
  onAddColumn,
  onCancelAddColumn,
}: BoardCanvasSectionProps) => (
  <Box
    sx={{
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    {isLoading ? (
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flex: 1,
          minHeight: 0,
          px: { xs: 2, sm: 3 },
          pt: 2,
        }}
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" width={280} height={400} />
        ))}
      </Box>
    ) : filteredBoard ? (
      <Box
        sx={{
          minWidth: 0,
          minHeight: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box
          ref={boardTopScrollRef}
          onScroll={onTopScroll}
          sx={{
            ...subtleScrollbarSx,
            display: hasBoardHorizontalOverflow ? 'block' : 'none',
            overflowX: 'auto',
            overflowY: 'hidden',
            height: 14,
            flexShrink: 0,
          }}
        >
          <Box sx={{ width: boardScrollWidth, height: 1 }} />
        </Box>
        <Box
          ref={boardScrollRef}
          onScroll={onBoardScroll}
          sx={{
            ...subtleScrollbarSx,
            flex: 1,
            minHeight: 0,
            overflowX: 'auto',
            overflowY: 'auto',
            minWidth: 0,
          }}
        >
          <Box
            ref={boardContentRef}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
              width: 'max-content',
              minWidth: '100%',
              boxSizing: 'border-box',
              px: { xs: 2, sm: 3 },
              pt: 2,
              pb: 2,
            }}
          >
            <Box sx={{ flexShrink: 0 }}>
              <KanbanBoard
                key={boardId}
                board={filteredBoard}
                highlightedTaskId={highlightedTaskId}
                isReorderDisabled={isReorderDisabled}
              />
            </Box>
            {canManageColumns && isAddingColumn ? (
              <AddColumnComposer
                title={newColumnTitle}
                isCreating={isCreatingColumn}
                onTitleChange={onNewColumnTitleChange}
                onSubmit={onAddColumn}
                onCancel={onCancelAddColumn}
              />
            ) : null}
          </Box>
        </Box>
      </Box>
    ) : null}
  </Box>
);

export default BoardCanvasSection;
