'use client';

import { Board, Task } from '@/shared/api/api';
import {
  emitBoardSocketMutation,
  isBoardSocketMutationQueuedError,
} from '@/shared/lib/boardSocketMutations';
import {
  moveTaskToColumnEndInBoard,
  queryKeys,
  updateTaskInBoard,
} from '@/shared/queries/boards.queries';
import { useBoardUIStore } from '@/shared/store/root.store';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  CalendarTodayOutlined,
  CheckCircleOutlined,
  FlagOutlined,
  LabelOutlined,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Card,
  Checkbox,
  Chip,
  Tooltip,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { Draggable } from '@hello-pangea/dnd';
import { useDayjsLocale } from '@/shared/lib/useDayjsLocale';
import { useRef, useState } from 'react';
import { useSnackbar } from 'notistack';

interface Props {
  task: Task;
  index: number;
  boardId: string;
  isPending?: boolean;
  isDragDisabled?: boolean;
}

const PRIORITY_CONFIG = {
  low: { color: '#22c55e', labelKey: 'priority.low' as const },
  medium: { color: '#f59e0b', labelKey: 'priority.medium' as const },
  high: { color: '#f97316', labelKey: 'priority.high' as const },
  urgent: { color: '#ef4444', labelKey: 'priority.urgent' as const },
} as const;

const TaskCard = ({
  task,
  index,
  boardId,
  isPending = false,
  isDragDisabled = false,
}: Props) => {
  useDayjsLocale();
  const openTask = useBoardUIStore((state) => state.openTask);
  const t = useTranslations('TaskCard');
  const tNotifications = useTranslations('Notifications');
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const priorityLabel = t(priority.labelKey);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isCompletionPending, setIsCompletionPending] = useState(false);
  const isCardPending = isPending || isCompletionPending;

  const isOverdue =
    !task.isCompleted &&
    task.dueDate &&
    dayjs(task.dueDate).isBefore(dayjs(), 'day');

  const handleToggleCompletion = async () => {
    if (isCardPending) return;

    const nextIsCompleted = !task.isCompleted;
    const previousBoard = qc.getQueryData<Board>(queryKeys.board(boardId));
    const optimisticTask: Task = {
      ...task,
      isCompleted: nextIsCompleted,
      completedAt: nextIsCompleted
        ? task.completedAt ?? new Date().toISOString()
        : undefined,
    };

    setIsCompletionPending(true);
    qc.setQueryData(queryKeys.board(boardId), (prev: Board | undefined) =>
      nextIsCompleted
        ? moveTaskToColumnEndInBoard(prev, optimisticTask)
        : updateTaskInBoard(prev, optimisticTask),
    );

    try {
      await emitBoardSocketMutation(
        'task:update',
        {
          boardId,
          taskId: task.id,
          changes: { isCompleted: nextIsCompleted },
        },
        { boardId },
      );

      qc.invalidateQueries({ queryKey: queryKeys.boardAnalytics(boardId) });
    } catch (error) {
      qc.setQueryData(queryKeys.board(boardId), previousBoard);
      enqueueSnackbar(
        tNotifications(
          isBoardSocketMutationQueuedError(error)
            ? 'taskQueued'
            : 'taskUpdateError',
        ),
        {
          variant: isBoardSocketMutationQueuedError(error) ? 'info' : 'error',
        },
      );
    } finally {
      setIsCompletionPending(false);
    }
  };

  return (
    <Draggable
      draggableId={task.id}
      index={index}
      isDragDisabled={isCardPending || isDragDisabled}
    >
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          elevation={snapshot.isDragging ? 8 : 0}
          aria-busy={isCardPending}
          aria-disabled={isCardPending || isDragDisabled}
          onClickCapture={(event) => {
            const { consumeSuppressedTaskClick } = useBoardUIStore.getState();
            const shouldSuppressClick = consumeSuppressedTaskClick(task.id);
            if (isCardPending || shouldSuppressClick) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
          sx={{
            mb: 1,
            border: '1px solid',
            borderColor: snapshot.isDragging
              ? 'primary.main'
              : task.isCompleted
                ? 'success.light'
                : 'divider',
            bgcolor: task.isCompleted
              ? (theme) => alpha(theme.palette.success.main, 0.06)
              : 'background.paper',
            cursor: isCardPending ? 'progress' : 'grab',
            '&:active': { cursor: isCardPending ? 'progress' : 'grabbing' },
            transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
            transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
            position: 'relative',
            overflow: isCardPending ? 'hidden' : 'visible',
            opacity: isCardPending ? 0.78 : 1,
            animation: isCardPending
              ? 'taskCardPendingPulse 1.15s ease-in-out infinite'
              : undefined,
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 4,
              bottom: 4,
              width: 3,
              bgcolor: priority.color,
              borderRadius: '0 2px 2px 0',
            },
            '&::after': isCardPending
              ? {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  background: (theme) =>
                    `linear-gradient(90deg, transparent 0%, ${alpha(
                      theme.palette.action.hover,
                      0.9,
                    )} 50%, transparent 100%)`,
                  transform: 'translateX(-100%)',
                  animation: 'taskCardPending 1.35s ease-in-out infinite',
                }
              : undefined,
            '@keyframes taskCardPending': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' },
            },
            '@keyframes taskCardPendingPulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.26)' },
              '70%': { boxShadow: '0 0 0 7px rgba(34, 197, 94, 0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0)' },
            },
          }}
          >
          <Box
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
          >
            <Tooltip
              title={
                task.isCompleted ? t('markIncomplete') : t('markComplete')
              }
            >
              <span>
                <Checkbox
                  size="small"
                  checked={!!task.isCompleted}
                  disabled={isCardPending}
                  onChange={handleToggleCompletion}
                  icon={<RadioButtonUnchecked fontSize="small" />}
                  checkedIcon={<CheckCircleOutlined fontSize="small" />}
                  slotProps={{
                    input: {
                      'aria-label': t('completionToggle'),
                    },
                  }}
                  sx={{
                    p: 0,
                    width: 20,
                    height: 20,
                    color: 'text.disabled',
                    '&.Mui-checked': {
                      color: 'success.main',
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: 20,
                    },
                  }}
                />
              </span>
            </Tooltip>
            {task.assigneeName && (
              <Tooltip title={task.assigneeName}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 9,
                      color: 'white',
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {task.assigneeName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>

          <Box
            onPointerDown={(event) => {
              pointerStartRef.current = {
                x: event.clientX,
                y: event.clientY,
              };
            }}
            onPointerUp={(event) => {
              const pointerStart = pointerStartRef.current;
              pointerStartRef.current = null;
              if (!pointerStart || isCardPending) return;

              const deltaX = event.clientX - pointerStart.x;
              const deltaY = event.clientY - pointerStart.y;
              const distance = Math.hypot(deltaX, deltaY);
              if (distance > 6) return;

              openTask(task.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            sx={{
              p: 1.5,
              pl: 2,
              pr: 4.5,
              pointerEvents: isCardPending ? 'none' : 'auto',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                lineHeight: 1.4,
                mb: task.labels?.length ? 1 : 0,
                fontWeight: 500,
                color: task.isCompleted ? 'text.secondary' : 'text.primary',
                textDecoration: task.isCompleted ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </Typography>

            {task.labels && task.labels.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {task.labels.slice(0, 3).map((label) => (
                  <Chip
                    key={label}
                    label={label}
                    size="small"
                    icon={
                      <LabelOutlined sx={{ fontSize: '12px !important' }} />
                    }
                    sx={{
                      height: 20,
                      fontSize: 11,
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                ))}
              </Box>
            )}

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                columnGap: 1,
                rowGap: 0.5,
                flexWrap: 'wrap',
                mt: 0.5,
              }}
            >
              {task.isCompleted && (
                <Tooltip title={t('completedTooltip')}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.25,
                      color: 'success.main',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircleOutlined sx={{ fontSize: 13 }} />
                    <Typography
                      variant="caption"
                      sx={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}
                    >
                      {t('completed')}
                    </Typography>
                  </Box>
                </Tooltip>
              )}

              <Tooltip title={t('priorityTooltip', { priority: priorityLabel })}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.25,
                    flexShrink: 0,
                  }}
                >
                  <FlagOutlined sx={{ fontSize: 13, color: priority.color }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: priority.color,
                      fontSize: 11,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {priorityLabel}
                  </Typography>
                </Box>
              </Tooltip>

              {task.dueDate && (
                <Tooltip
                  title={t('deadlineTooltip', {
                    date: dayjs(task.dueDate).format('D MMM'),
                  })}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.25,
                      color: isOverdue ? 'error.main' : 'text.secondary',
                      flexShrink: 0,
                    }}
                  >
                    <CalendarTodayOutlined sx={{ fontSize: 12 }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: 11,
                        fontWeight: isOverdue ? 600 : 400,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {dayjs(task.dueDate).format('D MMM')}
                    </Typography>
                  </Box>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Card>
      )}
    </Draggable>
  );
};

export default TaskCard;
