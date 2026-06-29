'use client';

import type { Board } from '@/shared/api/api';
import { useAuth } from '@/features/auth/useAuth';
import { getAvailableWorkspaceMembers } from '@/shared/lib/board-members';
import { isBoardPermissionError } from '@/shared/lib/boardSocketMutations';
import { useDayjsLocale } from '@/shared/lib/useDayjsLocale';
import { useStableBodyScrollLock } from '@/shared/lib/useStableBodyScrollLock';
import { queryKeys } from '@/shared/queries/board-query-keys';
import {
  useBoard,
  useBoardMembers,
  useCreateColumn,
  useRevokeBoardMember,
  useShareBoard,
  useUpdateBoardMemberRole,
} from '@/shared/queries/boards.queries';
import {
  useMyWorkspaceTeams,
  useWorkspaceTeams,
} from '@/shared/queries/teams.queries';
import { useWorkspaceMembers } from '@/shared/queries/workspaces.queries';
import { useBoardUIStore } from '@/shared/store/root.store';
import { Box } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useRef, useState } from 'react';
import BoardFiltersToolbar from './BoardFiltersToolbar';
import {
  countBoardTasks,
  filterBoard,
  isBoardReorderDisabledByView,
} from './board-filters';
import BoardCanvasSection from './kanban-board-page/BoardCanvasSection';
import BoardMembersDrawer from './kanban-board-page/BoardMembersDrawer';
import BoardNotFoundState from './kanban-board-page/BoardNotFoundState';
import BoardPageHeader from './kanban-board-page/BoardPageHeader';
import BoardStatsDrawer from './kanban-board-page/BoardStatsDrawer';
import { useBoardAnalyticsController } from './kanban-board-page/useBoardAnalyticsController';
import { useBoardFiltersController } from './kanban-board-page/useBoardFiltersController';
import TaskDetailModal from './TaskDetailModal';

interface Props {
  boardId: string;
  initialBoard?: Board;
}

const KanbanBoardPage = ({ boardId, initialBoard }: Props) => {
  const dayjsLocale = useDayjsLocale();
  const t = useTranslations('BoardPage');
  const router = useRouter();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [isInitialBoardSynced, setInitialBoardSynced] = useState(!initialBoard);
  const {
    data: queriedBoard,
    isLoading,
    isError,
  } = useBoard(boardId, initialBoard);
  const board = isInitialBoardSynced ? queriedBoard : initialBoard;
  const createColumn = useCreateColumn();
  const isAddingColumn = useBoardUIStore((state) => state.isAddingColumn);
  const closeTask = useBoardUIStore((state) => state.closeTask);
  const setAddingColumn = useBoardUIStore((state) => state.setAddingColumn);
  const setAddingTaskInColumn = useBoardUIStore(
    (state) => state.setAddingTaskInColumn,
  );
  const { user: currentUser } = useAuth();

  const [newColTitle, setNewColTitle] = useState('');
  const [isMembersOpen, setMembersOpen] = useState(false);
  const [isStatsOpen, setStatsOpen] = useState(false);
  const [shareUserId, setShareUserId] = useState('');
  const [shareRole, setShareRole] = useState<'editor' | 'viewer'>('editor');
  const [boardScrollWidth, setBoardScrollWidth] = useState(0);
  const [hasBoardHorizontalOverflow, setHasBoardHorizontalOverflow] =
    useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(
    null,
  );
  const boardScrollRef = useRef<HTMLDivElement | null>(null);
  const boardTopScrollRef = useRef<HTMLDivElement | null>(null);
  const boardContentRef = useRef<HTMLDivElement | null>(null);

  const boardMembers = useBoardMembers(boardId);
  const shareBoard = useShareBoard();
  const revokeMember = useRevokeBoardMember();
  const updateMemberRole = useUpdateBoardMemberRole();
  const {
    boardFilters,
    boardViews,
    selectedViewId,
    taskToHighlightId,
    isFiltering,
    createBoardView,
    deleteBoardView,
    updateBoardFilters,
    resetBoardFilters,
    applySavedView,
    saveCurrentView,
    removeSavedView,
  } = useBoardFiltersController(boardId);
  const boardAnalytics = useBoardAnalyticsController(boardId, dayjsLocale);
  const canEditBoardContent =
    board?.capabilities.canEditBoardContent ?? false;
  const canManageColumns = board?.capabilities.canManageColumns ?? false;
  const canManageBoardMembers =
    board?.capabilities.canManageBoardMembers ?? false;
  const workspaceMembers = useWorkspaceMembers(
    board?.workspaceId ?? '',
    isMembersOpen && canManageBoardMembers,
  );
  const workspaceTeams = useWorkspaceTeams(
    board?.workspaceId ?? '',
    Boolean(board?.workspaceId),
  );
  const myWorkspaceTeams = useMyWorkspaceTeams(
    board?.workspaceId ?? '',
    Boolean(board?.workspaceId),
  );
  const availableWorkspaceMembers = useMemo(
    () =>
      getAvailableWorkspaceMembers(
        workspaceMembers.data,
        boardMembers.data,
      ),
    [boardMembers.data, workspaceMembers.data],
  );
  const isShareMembersLoading =
    workspaceMembers.isLoading || boardMembers.isLoading;
  const isShareMembersError =
    workspaceMembers.isError || boardMembers.isError;
  const myTeamIds = useMemo(
    () => myWorkspaceTeams.data?.map((team) => team.id) ?? [],
    [myWorkspaceTeams.data],
  );
  const filteredBoard = useMemo(
    () =>
      board
        ? filterBoard(board, boardFilters, {
            currentUserId: currentUser?.id,
            myTeamIds,
          })
        : undefined,
    [board, boardFilters, currentUser?.id, myTeamIds],
  );
  const totalTaskCount = useMemo(() => countBoardTasks(board), [board]);
  const filteredTaskCount = useMemo(
    () => countBoardTasks(filteredBoard),
    [filteredBoard],
  );
  const isReorderDisabledByView =
    isBoardReorderDisabledByView(boardFilters);

  useStableBodyScrollLock(isMembersOpen || isStatsOpen);

  useEffect(() => {
    if (!initialBoard) return;

    qc.setQueryData(queryKeys.board(boardId), initialBoard);
    setInitialBoardSynced(true);
  }, [boardId, initialBoard, qc]);

  useEffect(() => {
    closeTask();
    setAddingColumn(false);
    setAddingTaskInColumn(null);
  }, [boardId, closeTask, setAddingColumn, setAddingTaskInColumn]);

  useEffect(() => {
    if (!canManageColumns) setAddingColumn(false);
    if (!canEditBoardContent) setAddingTaskInColumn(null);
  }, [
    canEditBoardContent,
    canManageColumns,
    setAddingColumn,
    setAddingTaskInColumn,
  ]);

  useEffect(() => {
    const content = boardContentRef.current;
    const scrollContainer = boardScrollRef.current;
    if (!content) return;

    const updateWidth = () => {
      const nextScrollWidth = content.scrollWidth;
      setBoardScrollWidth(nextScrollWidth);
      setHasBoardHorizontalOverflow(
        scrollContainer
          ? nextScrollWidth > scrollContainer.clientWidth + 1
          : false,
      );
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(content);
    if (scrollContainer) observer.observe(scrollContainer);

    return () => observer.disconnect();
  }, [filteredBoard, isAddingColumn]);

  useEffect(() => {
    if (!taskToHighlightId || !board) return;

    setHighlightedTaskId(taskToHighlightId);

    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById(`task-${taskToHighlightId}`)
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        });
    }, 100);
    const highlightTimer = window.setTimeout(() => {
      setHighlightedTaskId((current) =>
        current === taskToHighlightId ? null : current,
      );
    }, 3000);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(highlightTimer);
    };
  }, [board, taskToHighlightId]);

  const syncBoardScroll = () => {
    if (!boardScrollRef.current || !boardTopScrollRef.current) return;
    boardTopScrollRef.current.scrollLeft = boardScrollRef.current.scrollLeft;
  };

  const syncTopScroll = () => {
    if (!boardScrollRef.current || !boardTopScrollRef.current) return;
    boardScrollRef.current.scrollLeft = boardTopScrollRef.current.scrollLeft;
  };

  const handleShareBoard = () => {
    if (!shareUserId) return;
    shareBoard.mutate(
      { boardId, userId: shareUserId, role: shareRole },
      {
        onSuccess: () => {
          setShareUserId('');
          setShareRole('editor');
          enqueueSnackbar(t('memberAdded'), { variant: 'success' });
        },
      },
    );
  };

  const handleAddColumn = () => {
    if (!canManageColumns) return;
    const title = newColTitle.trim();
    if (!title) return;
    createColumn.mutate(
      { title, boardId },
      {
        onSuccess: () => {
          setNewColTitle('');
          setAddingColumn(false);
        },
        onError: (error) => {
          if (isBoardPermissionError(error)) {
            void qc.invalidateQueries({
              queryKey: queryKeys.board(boardId),
              exact: true,
            });
          }
          enqueueSnackbar(
            t(
              isBoardPermissionError(error)
                ? 'permissionDenied'
                : 'columnCreateError',
            ),
            { variant: 'error' },
          );
        },
      },
    );
  };

  if (isError) {
    return <BoardNotFoundState onBack={() => router.push('/workspaces')} />;
  }

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <BoardPageHeader
        board={board}
        isLoading={isLoading}
        canManageColumns={canManageColumns}
        canEditBoardContent={canEditBoardContent}
        isStatsOpen={isStatsOpen}
        isMembersOpen={isMembersOpen}
        onAddColumn={() => setAddingColumn(true)}
        onToggleStats={() => {
          setMembersOpen(false);
          setStatsOpen((open) => !open);
        }}
        onToggleMembers={() => {
          setStatsOpen(false);
          setMembersOpen((open) => !open);
        }}
      />

      {board && (
        <BoardFiltersToolbar
          filters={boardFilters}
          onChange={updateBoardFilters}
          onReset={resetBoardFilters}
          boardMembers={boardMembers.data}
          teams={workspaceTeams.data}
          filteredCount={filteredTaskCount}
          totalCount={totalTaskCount}
          isFiltering={isFiltering}
          isReorderDisabled={isReorderDisabledByView}
          savedViews={boardViews.data}
          selectedViewId={selectedViewId}
          isSavingView={createBoardView.isPending}
          isDeletingView={deleteBoardView.isPending}
          onApplySavedView={applySavedView}
          onSaveView={saveCurrentView}
          onDeleteSavedView={removeSavedView}
        />
      )}

      <BoardCanvasSection
        boardId={boardId}
        isLoading={isLoading}
        isFiltering={isFiltering}
        filteredBoard={filteredBoard}
        highlightedTaskId={highlightedTaskId}
        isReorderDisabled={isReorderDisabledByView}
        canManageColumns={canManageColumns}
        isAddingColumn={isAddingColumn}
        newColumnTitle={newColTitle}
        isCreatingColumn={createColumn.isPending}
        boardScrollWidth={boardScrollWidth}
        hasBoardHorizontalOverflow={hasBoardHorizontalOverflow}
        boardScrollRef={boardScrollRef}
        boardTopScrollRef={boardTopScrollRef}
        boardContentRef={boardContentRef}
        onBoardScroll={syncBoardScroll}
        onTopScroll={syncTopScroll}
        onNewColumnTitleChange={setNewColTitle}
        onAddColumn={handleAddColumn}
        onCancelAddColumn={() => setAddingColumn(false)}
      />

      <BoardStatsDrawer
        open={isStatsOpen}
        analyticsPeriod={boardAnalytics.analyticsPeriod}
        chartData={boardAnalytics.chartData}
        chartXAxisLabels={boardAnalytics.chartXAxisLabels}
        isChartLoading={boardAnalytics.isChartLoading}
        isChartError={boardAnalytics.isChartError}
        onTimeCount={boardAnalytics.onTimeCount}
        lateCount={boardAnalytics.lateCount}
        todayCompletedCount={boardAnalytics.todayCompletedCount}
        onClose={() => setStatsOpen(false)}
        onAnalyticsPeriodChange={boardAnalytics.setAnalyticsPeriod}
      />

      <BoardMembersDrawer
        open={isMembersOpen}
        canManageBoardMembers={canManageBoardMembers}
        currentUserId={currentUser?.id}
        boardMembers={boardMembers.data}
        isBoardMembersLoading={boardMembers.isLoading}
        workspaceTeams={workspaceTeams.data}
        availableWorkspaceMembers={availableWorkspaceMembers}
        shareUserId={shareUserId}
        shareRole={shareRole}
        isShareMembersLoading={isShareMembersLoading}
        isShareMembersError={isShareMembersError}
        isSharePending={shareBoard.isPending}
        isShareError={shareBoard.isError}
        isUpdateMemberRolePending={updateMemberRole.isPending}
        isUpdateMemberRoleError={updateMemberRole.isError}
        isRevokeMemberPending={revokeMember.isPending}
        isRevokeMemberError={revokeMember.isError}
        onClose={() => setMembersOpen(false)}
        onShareUserIdChange={setShareUserId}
        onShareRoleChange={setShareRole}
        onShareBoard={handleShareBoard}
        onUpdateMemberRole={(memberId, role) =>
          updateMemberRole.mutate({ boardId, memberId, role })
        }
        onRevokeMember={(memberId) =>
          revokeMember.mutate({ boardId, memberId })
        }
      />

      {board && <TaskDetailModal board={board} />}
    </Box>
  );
};

export default KanbanBoardPage;
