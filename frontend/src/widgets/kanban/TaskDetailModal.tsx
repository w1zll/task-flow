'use client';

import { Board, Task } from '@/shared/api/api';
import { useBoardSocket } from '@/shared/hooks/useBoardSocket';
import { getSocket } from '@/shared/lib/socket';
import { useDeleteTask } from '@/shared/queries/boards.queries';
import { useBoardUIStore } from '@/shared/store/root.store';
import {
  CalendarToday,
  Close,
  Delete,
  Flag,
  Label,
  Person,
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
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

interface Props {
  board: Board;
}

dayjs.locale('ru');

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Низкий', color: '#22c55e' },
  { value: 'medium', label: 'Средний', color: '#f59e0b' },
  { value: 'high', label: 'Высокий', color: '#f97316' },
  { value: 'urgent', label: 'Срочный', color: '#ef4444' },
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

const TaskDetailModal = observer(({ board }: Props) => {
  const boardUI = useBoardUIStore();
  const deleteTask = useDeleteTask();

  const socket = getSocket();

  const task =
    board.columns
      ?.flatMap((c) => c.tasks ?? [])
      .find((t) => t.id === boardUI.openTaskId) ?? null;

  const [form, setForm] = useState<Partial<Task>>({});
  const [labelInput, setLabelInput] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
      });
      setIsDirty(false);
    }
  }, [task?.id]);

  useEffect(() => {
    const handleTaskUpdate = (updatedTask: Task) => {
      if (updatedTask.id === task?.id) {
        setIsUpdating(false);
      }
    };

    socket.on('task:update', handleTaskUpdate);

    return () => {
      socket.off('task:update', handleTaskUpdate);
    };
  }, [task?.id, socket]);

  const patch = <K extends keyof Task>(key: K, value: Task[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!task) return;
    setIsUpdating(true);
    socket.emit('task:update', {
      boardId: board.id,
      taskId: task.id,
      changes: form,
    });
    setIsDirty(false);
    // isUpdating сбросится по событию 'task:update' от сервера
  };

  const handleDelete = () => {
    if (!task) return;
    deleteTask.mutate({ id: task.id, boardId: board.id });
    boardUI.closeTask();
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
      PaperProps={{ sx: { borderRadius: 2 } }}
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
            В колонке: <b>{columnTitle}</b>
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
          label="Название"
          fullWidth
          value={form.title ?? ''}
          onChange={(e) => patch('title', e.target.value as any)}
          inputProps={{ style: { fontWeight: 600 } }}
        />

        <TextField
          label="Описание"
          fullWidth
          multiline
          rows={3}
          value={form.description ?? ''}
          onChange={(e) => patch('description', e.target.value as any)}
          placeholder="Введите описание задачи..."
        />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Приоритет</InputLabel>
            <Select
              label="Приоритет"
              value={form.priority ?? 'medium'}
              onChange={(e) => patch('priority', e.target.value as any)}
              renderValue={(val) => {
                const opt = PRIORITY_OPTIONS.find((o) => o.value === val);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Flag sx={{ fontSize: 14, color: opt?.color }} />
                    <span>{opt?.label}</span>
                  </Box>
                );
              }}
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Flag sx={{ fontSize: 14, color: opt.color, mr: 1 }} />
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Срок выполнения"
            type="date"
            size="small"
            sx={{ minWidth: 160 }}
            value={form.dueDate ?? ''}
            onChange={(e) => patch('dueDate', e.target.value as any)}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <CalendarToday
                  sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }}
                />
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
            <InputLabel>Ответственный</InputLabel>
            <Select
              label="Ответственный"
              value={form.assigneeId ?? ''}
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
                return member?.user?.name ?? 'Не указан';
              }}
            >
              <MenuItem value="">Не указан</MenuItem>
              {board.members?.map((member) => (
                <MenuItem key={member.id} value={member.userId}>
                  {member.user.name}
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
            <Label sx={{ fontSize: 14 }} /> Метки
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
                  onClick={() =>
                    active ? removeLabel(preset) : addLabel(preset)
                  }
                  sx={{ cursor: 'pointer', fontSize: 11 }}
                />
              );
            })}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Новая метка"
              value={labelInput}
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
            >
              Добавить
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
                    onDelete={() => removeLabel(label)}
                    sx={{ fontSize: 11 }}
                  />
                ))}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {/* сделать чтобы месяц был на русском языке */}
            Создан: {dayjs(task.createdAt).format('D MMMM, YYYY')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Изменен: {dayjs(task.updatedAt).format('D MMMM, YYYY')}
          </Typography>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button
          color="error"
          startIcon={<Delete />}
          onClick={handleDelete}
          size="small"
        >
          Удалить задачу
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={() => boardUI.closeTask()} size="small">
            Отмена
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={!isDirty || isUpdating}
            size="small"
          >
            {isUpdating ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
});

export default TaskDetailModal;
