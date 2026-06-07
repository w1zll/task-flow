'use client';

import { Task } from '@/shared/api/api';
import { useBoardUIStore } from '@/shared/store/root.store';
import { useTranslations } from 'next-intl';
import {
  CalendarTodayOutlined,
  FlagOutlined,
  LabelOutlined,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Card,
  Chip,
  Tooltip,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { Draggable } from '@hello-pangea/dnd';
import { useDayjsLocale } from '@/shared/lib/useDayjsLocale';
import { useRef } from 'react';

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
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const priorityLabel = t(priority.labelKey);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const isOverdue =
    task.dueDate && dayjs(task.dueDate).isBefore(dayjs(), 'day');

  return (
    <Draggable
      draggableId={task.id}
      index={index}
      isDragDisabled={isPending || isDragDisabled}
    >
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          elevation={snapshot.isDragging ? 8 : 0}
          aria-busy={isPending}
          aria-disabled={isPending || isDragDisabled}
          onClickCapture={(event) => {
            const { consumeSuppressedTaskClick } = useBoardUIStore.getState();
            const shouldSuppressClick = consumeSuppressedTaskClick(task.id);
            if (isPending || shouldSuppressClick) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
          sx={{
            mb: 1,
            border: '1px solid',
            borderColor: snapshot.isDragging ? 'primary.main' : 'divider',
            cursor: isPending ? 'progress' : 'grab',
            '&:active': { cursor: isPending ? 'progress' : 'grabbing' },
            transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
            transition: 'transform 0.15s, box-shadow 0.15s',
            position: 'relative',
            overflow: isPending ? 'hidden' : 'visible',
            opacity: isPending ? 0.78 : 1,
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
            '&::after': isPending
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
          }}
        >
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
              if (!pointerStart || isPending) return;

              const deltaX = event.clientX - pointerStart.x;
              const deltaY = event.clientY - pointerStart.y;
              const distance = Math.hypot(deltaX, deltaY);
              if (distance > 6) return;

              openTask(task.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            sx={{ p: 1.5, pl: 2, pointerEvents: isPending ? 'none' : 'auto' }}
          >
            <Typography
              variant="body2"
              sx={{
                lineHeight: 1.4,
                mb: task.labels?.length ? 1 : 0,
                fontWeight: 500,
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
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}
            >
              <Tooltip title={t('priorityTooltip', { priority: priorityLabel })}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <FlagOutlined sx={{ fontSize: 13, color: priority.color }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: priority.color,
                      fontSize: 11,
                      fontWeight: 600,
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
                    }}
                  >
                    <CalendarTodayOutlined sx={{ fontSize: 12 }} />
                    <Typography
                      variant="caption"
                      sx={{ fontSize: 11, fontWeight: isOverdue ? 600 : 400 }}
                    >
                      {dayjs(task.dueDate).format('D MMM')}
                    </Typography>
                  </Box>
                </Tooltip>
              )}

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
                      ml: 'auto',
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
          </Box>
        </Card>
      )}
    </Draggable>
  );
};

export default TaskCard;
