'use client';

import type { Workspace } from '@/shared/api/api';
import { useStableBodyScrollLock } from '@/shared/lib/useStableBodyScrollLock';
import { useBoards, useDeleteBoard } from '@/shared/queries/boards.queries';
import {
  useCreateWorkspace,
  useDeleteWorkspace,
  useWorkspaces,
} from '@/shared/queries/workspaces.queries';
import { useAuthStore } from '@/shared/store/root.store';
import { Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';
import BoardCreateDialog from './BoardCreateDialog';
import BoardActionsMenu from './boards-page/BoardActionsMenu';
import BoardsContent from './boards-page/BoardsContent';
import BoardsPageHeader from './boards-page/BoardsPageHeader';
import CreateWorkspaceDialog from './boards-page/CreateWorkspaceDialog';
import DeleteWorkspaceDialog from './boards-page/DeleteWorkspaceDialog';
import type { BoardMenuAnchor } from './boards-page/types';

interface Props {
  initialWorkspaces?: Workspace[];
  workspaceId?: string;
}

const BoardsClientPage = ({ initialWorkspaces = [], workspaceId }: Props) => {
  const t = useTranslations('Boards');
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { data: boards, isLoading: boardsLoading } = useBoards();
  const deleteBoard = useDeleteBoard();
  const workspaces = useWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const setActiveWorkspace = useAuthStore((state) => state.setActiveWorkspace);
  const workspaceData = workspaces.data ?? initialWorkspaces;
  const activeWorkspace = workspaceData.find((workspace) => workspace.isActive);
  const currentWorkspace = workspaceId
    ? workspaceData.find((workspace) => workspace.id === workspaceId)
    : undefined;
  const isWorkspaceMode = Boolean(workspaceId);
  const [createOpen, setCreateOpen] = useState(false);
  const [createBoardWorkspaceId, setCreateBoardWorkspaceId] = useState<
    string | undefined
  >(workspaceId);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceToDeleteId, setWorkspaceToDeleteId] = useState<string | null>(
    null,
  );
  const [menuAnchor, setMenuAnchor] = useState<BoardMenuAnchor | null>(null);

  useStableBodyScrollLock(createWorkspaceOpen);

  const visibleBoards = useMemo(
    () =>
      workspaceId
        ? (boards ?? []).filter((board) => board.workspaceId === workspaceId)
        : (boards ?? []),
    [boards, workspaceId],
  );

  const groupedBoards = useMemo(
    () =>
      workspaceData.map((workspace) => ({
        workspace,
        boards: (boards ?? []).filter(
          (board) => board.workspaceId === workspace.id,
        ),
      })),
    [boards, workspaceData],
  );

  const isLoading = boardsLoading || workspaces.isLoading;
  const workspaceToDelete = workspaceData.find(
    (workspace) => workspace.id === workspaceToDeleteId,
  );

  const handleDeleteBoard = (id: string) => {
    setMenuAnchor(null);
    deleteBoard.mutate(id, {
      onSuccess: () =>
        enqueueSnackbar(t('deleteSuccess'), { variant: 'success' }),
    });
  };

  const openBoardDialog = (targetWorkspaceId = workspaceId) => {
    setCreateBoardWorkspaceId(targetWorkspaceId);
    setCreateOpen(true);
  };

  const closeWorkspaceDialog = () => {
    if (createWorkspace.isPending) return;
    setCreateWorkspaceOpen(false);
  };

  const handleCreateWorkspace = () => {
    const name = workspaceName.trim();
    if (!name) return;

    createWorkspace.mutate(name, {
      onSuccess: (workspace) => {
        setActiveWorkspace(workspace.id);
        setWorkspaceName('');
        setCreateWorkspaceOpen(false);
        enqueueSnackbar(t('workspaceCreateSuccess'), {
          variant: 'success',
        });
        router.push(`/workspaces/${workspace.id}`);
        router.refresh();
      },
      onError: () =>
        enqueueSnackbar(t('workspaceCreateError'), { variant: 'error' }),
    });
  };

  const requestCloseDeleteWorkspace = () => {
    if (!deleteWorkspace.isPending) {
      setWorkspaceToDeleteId(null);
    }
  };

  const handleDeleteWorkspace = () => {
    if (!workspaceToDelete) return;

    const nextActiveWorkspace = workspaceToDelete.isActive
      ? (workspaceData.find(
          (workspace) => workspace.id !== workspaceToDelete.id,
        )?.id ?? null)
      : (activeWorkspace?.id ?? null);

    deleteWorkspace.mutate(workspaceToDelete.id, {
      onSuccess: () => {
        setWorkspaceToDeleteId(null);
        setActiveWorkspace(nextActiveWorkspace);
        enqueueSnackbar(t('workspaceDeleteSuccess'), {
          variant: 'success',
        });
        router.refresh();
      },
      onError: () =>
        enqueueSnackbar(t('workspaceDeleteError'), { variant: 'error' }),
    });
  };

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
        <BoardsPageHeader
          isWorkspaceMode={isWorkspaceMode}
          currentWorkspace={currentWorkspace}
          visibleBoardsCount={visibleBoards.length}
          workspacesCount={workspaceData.length}
          onCreateBoard={() => openBoardDialog()}
          onCreateWorkspace={() => setCreateWorkspaceOpen(true)}
        />

        <BoardsContent
          isLoading={isLoading}
          isWorkspaceMode={isWorkspaceMode}
          visibleBoards={visibleBoards}
          groupedBoards={groupedBoards}
          onCreateBoard={openBoardDialog}
          onCreateWorkspace={() => setCreateWorkspaceOpen(true)}
          onDeleteWorkspace={setWorkspaceToDeleteId}
          onOpenBoardMenu={(el, board) => setMenuAnchor({ el, board })}
        />
      </Box>

      <BoardActionsMenu
        anchor={menuAnchor}
        onClose={() => setMenuAnchor(null)}
        onDelete={handleDeleteBoard}
      />

      <BoardCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        workspaces={workspaceData}
        defaultWorkspaceId={createBoardWorkspaceId ?? activeWorkspace?.id}
        lockWorkspace={isWorkspaceMode}
      />

      <CreateWorkspaceDialog
        open={createWorkspaceOpen}
        workspaceName={workspaceName}
        isCreating={createWorkspace.isPending}
        onClose={closeWorkspaceDialog}
        onWorkspaceNameChange={setWorkspaceName}
        onCreate={handleCreateWorkspace}
      />

      <DeleteWorkspaceDialog
        workspace={workspaceToDelete}
        isDeleting={deleteWorkspace.isPending}
        onRequestClose={requestCloseDeleteWorkspace}
        onCancel={() => setWorkspaceToDeleteId(null)}
        onConfirm={handleDeleteWorkspace}
      />
    </Box>
  );
};

export default BoardsClientPage;
