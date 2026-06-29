'use client';

import type { Board } from '@/shared/api/api';
import { Grid, Stack } from '@mui/material';
import BoardCard from './BoardCard';
import BoardsEmptyState from './BoardsEmptyState';
import BoardsLoadingGrid from './BoardsLoadingGrid';
import type { WorkspaceBoardGroup } from './types';
import WorkspaceBoardGroupCard from './WorkspaceBoardGroupCard';

interface BoardsContentProps {
  isLoading: boolean;
  isWorkspaceMode: boolean;
  visibleBoards: Board[];
  groupedBoards: WorkspaceBoardGroup[];
  onCreateBoard: (workspaceId?: string) => void;
  onCreateWorkspace: () => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onOpenBoardMenu: (anchor: HTMLElement, board: Board) => void;
}

const BoardsContent = ({
  isLoading,
  isWorkspaceMode,
  visibleBoards,
  groupedBoards,
  onCreateBoard,
  onCreateWorkspace,
  onDeleteWorkspace,
  onOpenBoardMenu,
}: BoardsContentProps) => {
  if (isLoading) {
    return <BoardsLoadingGrid />;
  }

  if (isWorkspaceMode) {
    return visibleBoards.length ? (
      <Grid container spacing={2}>
        {visibleBoards.map((board) => (
          <BoardCard
            key={board.id}
            board={board}
            onOpenMenu={onOpenBoardMenu}
          />
        ))}
      </Grid>
    ) : (
      <BoardsEmptyState
        titleKey="emptyWorkspaceTitle"
        actionKey="emptyAction"
        onAction={() => onCreateBoard()}
      />
    );
  }

  return groupedBoards.length ? (
    <Stack spacing={2.5}>
      {groupedBoards.map((group) => (
        <WorkspaceBoardGroupCard
          key={group.workspace.id}
          workspace={group.workspace}
          boards={group.boards}
          onCreateBoard={onCreateBoard}
          onDeleteWorkspace={onDeleteWorkspace}
          onOpenBoardMenu={onOpenBoardMenu}
        />
      ))}
    </Stack>
  ) : (
    <BoardsEmptyState
      titleKey="emptyTitle"
      actionKey="newWorkspace"
      onAction={onCreateWorkspace}
    />
  );
};

export default BoardsContent;
