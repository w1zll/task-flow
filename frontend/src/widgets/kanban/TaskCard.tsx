'use client';

import { Task } from '@/shared/api/api';
import { useBoardUIStore } from '@/shared/store/root.store';
import {
  CalendarTodayOutlined,
  FlagOutlined,
  LabelOutlined,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Tooltip,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { observer } from 'mobx-react-lite';
import { Draggable } from '@hello-pangea/dnd';

interface Props {
  task: Task;
  index: number;
  boardId: string;
}

const PRIORITY_CONFIG = {
  low: { color: '#22c55e', label: 'Низкий' },
  medium: { color: '#f59e0b', label: 'Средний' },
  high: { color: '#f97316', label: 'Высокий' },
  urgent: { color: '#ef4444', label: 'Срочный' },
} as const;

const TaskCard = observer(({ task, index, boardId }: Props) => {
  const boardUI = useBoardUIStore();
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;

  const isOverdue =
    task.dueDate && dayjs(task.dueDate).isBefore(dayjs(), 'day');

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          elevation={snapshot.isDragging ? 8 : 0}
          sx={{
            mb: 1,
            border: '1px solid',
            borderColor: snapshot.isDragging ? 'primary.main' : 'divider',
            cursor: 'grab',
            '&:active': { cursor: 'grabbing' },
            transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
            transition: 'transform 0.15s, box-shadow 0.15s',
            position: 'relative',
            overflow: 'visible',
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
          }}
        >
          <Box
            onClick={() => boardUI.openTask(task.id)}
            onMouseDown={(e) => e.stopPropagation()}
            sx={{ p: 1.5, pl: 2 }}
          >
            <Typography
              variant="body2"
              fontWeight={500}
              sx={{ lineHeight: 1.4, mb: task.labels?.length ? 1 : 0 }}
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
              <Tooltip title={`Приоритет: ${priority.label}`}>
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
                    {priority.label}
                  </Typography>
                </Box>
              </Tooltip>

              {task.dueDate && (
                <Tooltip
                  title={`Срок: ${dayjs(task.dueDate).format('MMM D, YYYY')}`}
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
                      {dayjs(task.dueDate).format('MMM D')}
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
});

export default TaskCard;
