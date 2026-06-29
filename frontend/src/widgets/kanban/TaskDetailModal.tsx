'use client';

import type { Board, Task } from '@/shared/api/api';
import {
  emitBoardSocketMutation,
  isBoardPermissionError,
  isBoardSocketMutationQueuedError,
} from '@/shared/lib/boardSocketMutations';
import { useDayjsLocale } from '@/shared/lib/useDayjsLocale';
import { getSocket } from '@/shared/lib/socket';
import { useStableBodyScrollLock } from '@/shared/lib/useStableBodyScrollLock';
import {
  moveTaskToColumnEndInBoard,
  queryKeys,
  updateTaskInBoard,
  useDeleteTask,
} from '@/shared/queries/boards.queries';
import { useWorkspaceTeams } from '@/shared/queries/teams.queries';
import { useBoardUIStore } from '@/shared/store/root.store';
import {
  Box,
  Dialog,
  DialogContent,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import TaskAssignmentFields from './task-detail/TaskAssignmentFields';
import TaskDetailActions from './task-detail/TaskDetailActions';
import TaskDetailHeader from './task-detail/TaskDetailHeader';
import TaskLabelsEditor from './task-detail/TaskLabelsEditor';
import TaskPriorityDateFields from './task-detail/TaskPriorityDateFields';
import TaskTimestamps from './task-detail/TaskTimestamps';
import TaskTitleDescriptionFields from './task-detail/TaskTitleDescriptionFields';
import type { TaskDraft } from './task-detail/types';

interface Props {
  board: Board;
}

const TaskDetailModal = ({ board }: Props) => {
  const t = useTranslations('TaskDetail');
  const tNotifications = useTranslations('Notifications');
  const boardUI = useBoardUIStore();
  const deleteTask = useDeleteTask();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const dayjsLocale = useDayjsLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), {
    defaultMatches: false,
  });
  useStableBodyScrollLock(!!boardUI.openTaskId);

  const task =
    board.columns
      ?.flatMap((column) => column.tasks ?? [])
      .find((item) => item.id === boardUI.openTaskId) ?? null;

  const [form, setForm] = useState<TaskDraft>({});
  const [labelInput, setLabelInput] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const canEdit = board.capabilities.canEditBoardContent;
  const teams = useWorkspaceTeams(board.workspaceId, !!boardUI.openTaskId);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        labels: task.labels ?? [],
        dueDate: task.dueDate ? dayjs(task.dueDate).format('YYYY-MM-DD') : '',
        assigneeName: task.assigneeName ?? '',
        assigneeId: task.assigneeId ?? undefined,
        teamId: task.teamId ?? null,
        isCompleted: task.isCompleted,
        completedAt: task.completedAt,
      });
      setIsDirty(false);
    }
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleTaskUpdate = ({
      boardId,
      task: updatedTask,
    }: {
      boardId: string;
      task: Task;
    }) => {
      if (boardId === board.id && updatedTask.id === task?.id) {
        setIsUpdating(false);
      }
    };

    const socket = getSocket();

    socket.on('task:update', handleTaskUpdate);

    return () => {
      socket.off('task:update', handleTaskUpdate);
    };
  }, [board.id, task?.id]);

  const patch = <K extends keyof Task,>(key: K, value: Task[K]) => {
    if (!canEdit) return;
    setForm((previous) => ({ ...previous, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!task || !canEdit) return;

    const isCompletionChange =
      form.isCompleted !== undefined && form.isCompleted !== task.isCompleted;
    const previousBoard = qc.getQueryData<Board>(queryKeys.board(board.id));
    const optimisticTask: Task = {
      ...task,
      ...form,
      completedAt:
        form.isCompleted === true
          ? task.completedAt ?? new Date().toISOString()
          : form.isCompleted === false
            ? undefined
            : task.completedAt,
    };

    setIsUpdating(true);
    qc.setQueryData(queryKeys.board(board.id), (prev: Board | undefined) =>
      isCompletionChange && form.isCompleted
        ? moveTaskToColumnEndInBoard(prev, optimisticTask)
        : updateTaskInBoard(prev, optimisticTask),
    );

    try {
      await emitBoardSocketMutation(
        'task:update',
        {
          boardId: board.id,
          taskId: task.id,
          changes: form,
        },
        { boardId: board.id },
      );

      setIsDirty(false);
      if (isCompletionChange) {
        qc.invalidateQueries({
          queryKey: queryKeys.boardAnalytics(board.id),
        });
      }
      boardUI.closeTask();
    } catch (error) {
      qc.setQueryData(queryKeys.board(board.id), previousBoard);
      if (isBoardPermissionError(error)) {
        void qc.invalidateQueries({
          queryKey: queryKeys.board(board.id),
          exact: true,
        });
      }
      const isQueuedUpdate = isBoardSocketMutationQueuedError(error);
      enqueueSnackbar(
        tNotifications(
          isBoardPermissionError(error)
            ? 'permissionDenied'
            : isQueuedUpdate
              ? 'taskQueued'
              : 'taskUpdateError',
        ),
        {
          variant:
            !isBoardPermissionError(error) && isQueuedUpdate ? 'info' : 'error',
        },
      );
      if (isQueuedUpdate) {
        boardUI.closeTask();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    if (!task || !canEdit) return;
    deleteTask.mutate(
      { id: task.id, boardId: board.id },
      {
        onSuccess: () => boardUI.closeTask(),
        onError: (error) => {
          if (isBoardPermissionError(error)) {
            void qc.invalidateQueries({
              queryKey: queryKeys.board(board.id),
              exact: true,
            });
          }
          enqueueSnackbar(
            tNotifications(
              isBoardPermissionError(error)
                ? 'permissionDenied'
                : 'taskDeleteError',
            ),
            { variant: 'error' },
          );
        },
      },
    );
  };

  const addLabel = (label: string) => {
    const trimmed = label.trim().toLowerCase();
    if (!trimmed) return;
    const current = form.labels ?? [];
    if (!current.includes(trimmed)) {
      patch('labels', [...current, trimmed]);
    }
    setLabelInput('');
  };

  const removeLabel = (label: string) => {
    patch(
      'labels',
      (form.labels ?? []).filter((item) => item !== label),
    );
  };

  if (!task) return null;

  const columnTitle =
    board.columns?.find((column) => column.id === task.columnId)?.title ?? '';

  return (
    <Dialog
      open={!!boardUI.openTaskId}
      onClose={() => boardUI.closeTask()}
      onKeyDown={(event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key === 'Enter' &&
          canEdit &&
          isDirty &&
          !isUpdating
        ) {
          event.preventDefault();
          void handleSave();
        }
      }}
      aria-label={t('dialogTitle')}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : '6px',
          },
        },
      }}
    >
      <TaskDetailHeader
        columnTitle={columnTitle}
        onClose={() => boardUI.closeTask()}
      />

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          px: { xs: 2, sm: 3 },
          pt: '8px !important',
        }}
      >
        <TaskTitleDescriptionFields
          form={form}
          canEdit={canEdit}
          onPatch={patch}
        />

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            '& > *': {
              flex: { xs: '1 1 100%', sm: '1 1 220px' },
            },
          }}
        >
          <TaskPriorityDateFields
            form={form}
            canEdit={canEdit}
            onPatch={patch}
          />
          <TaskAssignmentFields
            form={form}
            board={board}
            teams={teams.data}
            isTeamsLoading={teams.isLoading}
            canEdit={canEdit}
            onPatch={patch}
          />
        </Box>

        <TaskLabelsEditor
          labels={form.labels ?? []}
          labelInput={labelInput}
          canEdit={canEdit}
          onLabelInputChange={setLabelInput}
          onAddLabel={addLabel}
          onRemoveLabel={removeLabel}
        />

        <TaskTimestamps task={task} dayjsLocale={dayjsLocale} />
      </DialogContent>

      <Divider />

      <TaskDetailActions
        canEdit={canEdit}
        isDirty={isDirty}
        isUpdating={isUpdating}
        onClose={() => boardUI.closeTask()}
        onDelete={handleDelete}
        onSave={handleSave}
      />
    </Dialog>
  );
};

export default TaskDetailModal;
