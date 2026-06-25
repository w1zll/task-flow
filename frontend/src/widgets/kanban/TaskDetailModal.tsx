'use client';

import { Board, Task } from '@/shared/api/api';
import {
  emitBoardSocketMutation,
  isBoardPermissionError,
  isBoardSocketMutationQueuedError,
} from '@/shared/lib/boardSocketMutations';
import { getSocket } from '@/shared/lib/socket';
import {
  moveTaskToColumnEndInBoard,
  queryKeys,
  updateTaskInBoard,
  useDeleteTask,
} from '@/shared/queries/boards.queries';
import { useBoardUIStore } from '@/shared/store/root.store';
import {
  CalendarToday,
  Close,
  Delete,
  Flag,
  Label,
  Save,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useDayjsLocale } from '@/shared/lib/useDayjsLocale';
import { useStableBodyScrollLock } from '@/shared/lib/useStableBodyScrollLock';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import UserAvatar from '@/shared/ui/UserAvatar';
import { useWorkspaceTeams } from '@/shared/queries/teams.queries';

interface Props {
  board: Board;
}

const PRIORITY_OPTIONS = [
  { value: 'low', color: '#22c55e' },
  { value: 'medium', color: '#f59e0b' },
  { value: 'high', color: '#f97316' },
  { value: 'urgent', color: '#ef4444' },
] as const;

const LABEL_PRESETS = [
  'bug',
  'feature',
  'design',
  'backend',
  'frontend',
  'docs',
  'refactor',
  'test',
];

const TaskDetailModal = ({ board }: Props) => {
  const t = useTranslations('TaskDetail');
  const tPriority = useTranslations('TaskCard');
  const tNotifications = useTranslations('Notifications');
  const boardUI = useBoardUIStore();
  const deleteTask = useDeleteTask();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const dayjsLocale = useDayjsLocale();
  useStableBodyScrollLock(!!boardUI.openTaskId);

  const task =
    board.columns
      ?.flatMap((c) => c.tasks ?? [])
      .find((t) => t.id === boardUI.openTaskId) ?? null;

  const [form, setForm] = useState<Partial<Task>>({});
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
  }, [task?.id]);

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

  const patch = <K extends keyof Task>(key: K, value: Task[K]) => {
    if (!canEdit) return;
    setForm((p) => ({ ...p, [key]: value }));
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
    const current = (form.labels as string[]) ?? [];
    if (!current.includes(trimmed)) {
      patch('labels', [...current, trimmed] as any);
    }
    setLabelInput('');
  };

  const removeLabel = (label: string) => {
    patch(
      'labels',
      ((form.labels as string[]) ?? []).filter((l) => l !== label) as any,
    );
  };

  if (!task) return null;

  const columnTitle =
    board.columns?.find((c) => c.id === task.columnId)?.title ?? '';

  return (
    <Dialog
      open={!!boardUI.openTaskId}
      onClose={() => boardUI.closeTask()}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: '6px' } } }}
    >
      <DialogTitle
        sx={{ pb: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 0.5 }}
          >
            {t('inColumn', { column: columnTitle })}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={() => boardUI.closeTask()}
          sx={{ mt: -0.5 }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          pt: '8px !important',
        }}
      >
        <TextField
          label={t('title')}
          fullWidth
          value={form.title ?? ''}
          disabled={!canEdit}
          onChange={(e) => patch('title', e.target.value as any)}
          slotProps={{ htmlInput: { style: { fontWeight: 600 } } }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={!!form.isCompleted}
              disabled={!canEdit}
              onChange={(event) =>
                patch('isCompleted', event.target.checked as any)
              }
              color="success"
            />
          }
          label={t('completed')}
          sx={{
            alignSelf: 'flex-start',
            m: 0,
            '& .MuiFormControlLabel-label': {
              fontSize: 14,
              fontWeight: 500,
            },
          }}
        />

        <TextField
          label={t('description')}
          fullWidth
          multiline
          rows={3}
          value={form.description ?? ''}
          disabled={!canEdit}
          onChange={(e) => patch('description', e.target.value as any)}
          placeholder={t('descriptionPlaceholder')}
        />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t('priority')}</InputLabel>
            <Select
              label={t('priority')}
              value={form.priority ?? 'medium'}
              disabled={!canEdit}
              onChange={(e) => patch('priority', e.target.value as any)}
              renderValue={(val) => {
                const opt = PRIORITY_OPTIONS.find((o) => o.value === val);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Flag sx={{ fontSize: 14, color: opt?.color }} />
                    <span>{opt ? tPriority(`priority.${opt.value}` as const) : ''}</span>
                  </Box>
                );
              }}
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Flag sx={{ fontSize: 14, color: opt.color, mr: 1 }} />
                  {tPriority(`priority.${opt.value}` as const)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label={t('dueDate')}
            type="date"
            size="small"
            sx={{ minWidth: 160 }}
            value={form.dueDate ?? ''}
            disabled={!canEdit}
            onChange={(e) => patch('dueDate', e.target.value as any)}
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                startAdornment: (
                  <CalendarToday
                    sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }}
                  />
                ),
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
            <InputLabel>{t('assignee')}</InputLabel>
            <Select
              label={t('assignee')}
              value={form.assigneeId ?? ''}
              disabled={!canEdit}
              onChange={(e) => {
                const selected = e.target.value as string;
                const member = board.members?.find(
                  (m) => m.userId === selected,
                );
                patch('assigneeId', selected as any);
                patch('assigneeName', member?.user?.name ?? '');
              }}
              renderValue={(val) => {
                const member = board.members?.find((m) => m.userId === val);
                return member ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UserAvatar
                      name={member.user.name}
                      src={member.user.avatar}
                      size={24}
                    />
                    <span>{member.user.name}</span>
                  </Box>
                ) : (
                  t('unassigned')
                );
              }}
            >
              <MenuItem value="">{t('unassigned')}</MenuItem>
              {board.members?.map((member) => (
                <MenuItem key={member.id} value={member.userId}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UserAvatar
                      name={member.user.name}
                      src={member.user.avatar}
                      size={24}
                    />
                    <span>{member.user.name}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
            <InputLabel>{t('team')}</InputLabel>
            <Select
              label={t('team')}
              value={form.teamId ?? ''}
              disabled={!canEdit || teams.isLoading}
              onChange={(event) =>
                patch(
                  'teamId',
                  (event.target.value || null) as Task['teamId'],
                )
              }
              renderValue={(value) => {
                const team = teams.data?.find((item) => item.id === value);
                return team ? (
                  <Chip
                    size="small"
                    label={team.name}
                    sx={{
                      bgcolor: team.color,
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  />
                ) : (
                  t('noTeam')
                );
              }}
            >
              <MenuItem value="">{t('noTeam')}</MenuItem>
              {teams.data?.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: team.color,
                      mr: 1,
                    }}
                  />
                  {team.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <Label sx={{ fontSize: 14 }} /> {t('labels')}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {LABEL_PRESETS.map((preset) => {
              const active = ((form.labels as string[]) ?? []).includes(preset);
              return (
                <Chip
                  key={preset}
                  label={preset}
                  size="small"
                  variant={active ? 'filled' : 'outlined'}
                  color={active ? 'primary' : 'default'}
                  onClick={
                    canEdit
                      ? () =>
                          active ? removeLabel(preset) : addLabel(preset)
                      : undefined
                  }
                  sx={{
                    cursor: canEdit ? 'pointer' : 'default',
                    fontSize: 11,
                  }}
                />
              );
            })}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder={t('newLabel')}
              value={labelInput}
              disabled={!canEdit}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addLabel(labelInput);
                }
              }}
              sx={{ flex: 1 }}
            />
            <Button
              size="small"
              variant="outlined"
              onClick={() => addLabel(labelInput)}
              disabled={!canEdit}
            >
              {t('add')}
            </Button>
          </Box>

          {((form.labels as string[]) ?? []).filter(
            (l) => !LABEL_PRESETS.includes(l),
          ).length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {((form.labels as string[]) ?? [])
                .filter((l) => !LABEL_PRESETS.includes(l))
                .map((label) => (
                  <Chip
                    key={label}
                    label={label}
                    size="small"
                    color="secondary"
                    onDelete={canEdit ? () => removeLabel(label) : undefined}
                    sx={{ fontSize: 11 }}
                  />
                ))}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {t('created')}{' '}
            {dayjs(task.createdAt).locale(dayjsLocale).format('D MMM')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('updated')}{' '}
            {dayjs(task.updatedAt).locale(dayjsLocale).format('D MMM')}
          </Typography>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        {canEdit ? (
          <Button
            color="error"
            startIcon={<Delete />}
            onClick={handleDelete}
            size="small"
          >
            {t('deleteTask')}
          </Button>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t('readOnly')}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={() => boardUI.closeTask()} size="small">
            {canEdit ? t('cancel') : t('close')}
          </Button>
          {canEdit && (
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={!isDirty || isUpdating}
              size="small"
            >
              {isUpdating ? t('saving') : t('save')}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailModal;
