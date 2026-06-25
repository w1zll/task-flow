'use client';

import { Board, BoardColumn } from '@/shared/api/api';
import {
  useCreateTask,
  useDeleteColumn,
  useUpdateColumn,
} from '@/shared/queries/boards.queries';
import { useBoardUIStore } from '@/shared/store/root.store';
import { Add, Check, Close, Delete, Edit, MoreHoriz } from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { useSnackbar } from 'notistack';
import { isBoardPermissionError } from '@/shared/lib/boardSocketMutations';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/queries/board-query-keys';

interface Props {
  column: BoardColumn;
  board: Board;
  index: number;
  pendingTaskId?: string | null;
  isColumnDragDisabled?: boolean;
  isTaskDragDisabled?: boolean;
}

const KanbanColumn = ({
  column,
  board,
  index,
  pendingTaskId,
  isColumnDragDisabled = false,
  isTaskDragDisabled = false,
}: Props) => {
  const t = useTranslations('KanbanColumn');
  const tNotifications = useTranslations('Notifications');
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const addingTaskInColumnId = useBoardUIStore(
    (state) => state.addingTaskInColumnId,
  );
  const setAddingTaskInColumn = useBoardUIStore(
    (state) => state.setAddingTaskInColumn,
  );
  const createTask = useCreateTask();
  const deleteColumn = useDeleteColumn();
  const updateColumn = useUpdateColumn();

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(column.title);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const canEditBoardContent = board.capabilities.canEditBoardContent;
  const canManageColumns = board.capabilities.canManageColumns;

  useEffect(() => {
    setTitleInput(column.title);
  }, [column.title]);

  const isAddingTask = addingTaskInColumnId === column.id;

  const handleAddTask = () => {
    if (!canEditBoardContent) return;
    const title = newTaskTitle.trim();
    if (!title) return;
    createTask.mutate(
      { title, columnId: column.id, boardId: board.id },
      {
        onSuccess: () => {
          setNewTaskTitle('');
          setAddingTaskInColumn(null);
        },
        onError: (error) => handleMutationError(error, 'taskCreateError'),
      },
    );
  };

  const handleRenameColumn = () => {
    if (!canManageColumns) return;
    const title = titleInput.trim();
    if (title && title !== column.title) {
      updateColumn.mutate(
        {
          id: column.id,
          data: { title },
          boardId: board.id,
        },
        {
          onError: (error) => handleMutationError(error, 'columnUpdateError'),
        },
      );
    }
    setIsEditingTitle(false);
  };

  const handleDeleteColumn = () => {
    if (!canManageColumns) return;
    setMenuAnchor(null);
    deleteColumn.mutate(
      { id: column.id, boardId: board.id },
      {
        onError: (error) => handleMutationError(error, 'columnDeleteError'),
      },
    );
  };

  const handleMutationError = (
    error: unknown,
    fallbackKey:
      | 'taskCreateError'
      | 'columnUpdateError'
      | 'columnDeleteError',
  ) => {
    if (isBoardPermissionError(error)) {
      void qc.invalidateQueries({
        queryKey: queryKeys.board(board.id),
        exact: true,
      });
    }
    enqueueSnackbar(
      tNotifications(
        isBoardPermissionError(error) ? 'permissionDenied' : fallbackKey,
      ),
      { variant: 'error' },
    );
  };

  return (
    <Draggable
      draggableId={column.id}
      index={index}
      isDragDisabled={isColumnDragDisabled}
    >
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          elevation={0}
          sx={{
            width: 280,
            flexShrink: 0,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? alpha(
                    theme.palette.background.paper,
                    snapshot.isDragging ? 0.95 : 0.8,
                  )
                : alpha(theme.palette.grey[100], snapshot.isDragging ? 1 : 0.8),
            border: '1px solid',
            borderColor: snapshot.isDragging ? 'primary.main' : 'divider',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            transition: 'border-color 0.15s',
          }}
        >
          <Box
            {...provided.dragHandleProps}
            sx={{
              px: 2,
              pt: 2,
              pb: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isColumnDragDisabled ? 'default' : 'grab',
            }}
          >
            {isEditingTitle ? (
              <TextField
                autoFocus
                size="small"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameColumn();
                  if (e.key === 'Escape') {
                    setTitleInput(column.title);
                    setIsEditingTitle(false);
                  }
                }}
                sx={{ flex: 1, mr: 1 }}
                slotProps={{
                  htmlInput: { style: { fontWeight: 600 } },
                  input: {
                    endAdornment: (
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleRenameColumn}
                        >
                          <Check fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setTitleInput(column.title);
                            setIsEditingTitle(false);
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    ),
                  },
                }}
              />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                  {column.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    bgcolor: 'action.selected',
                    px: 0.8,
                    py: 0.2,
                    borderRadius: '4px',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {column.tasks?.length ?? 0}
                </Typography>
              </Box>
            )}

            {(canEditBoardContent || canManageColumns) && (
              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                {canEditBoardContent && (
                  <Tooltip title={t('addTask')}>
                    <IconButton
                      size="small"
                      onClick={() => setAddingTaskInColumn(column.id)}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {canManageColumns && (
                  <IconButton
                    size="small"
                    onClick={(e) => setMenuAnchor(e.currentTarget)}
                  >
                    <MoreHoriz fontSize="small" />
                  </IconButton>
                )}
              </Box>
            )}
          </Box>

          <Droppable droppableId={column.id} type="TASK">
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{
                  flex: '0 1 auto',
                  overflow: 'visible',
                  px: 1.5,
                  pb: 1,
                  minHeight: 60,
                  bgcolor: snapshot.isDraggingOver
                    ? (theme) => alpha(theme.palette.primary.main, 0.04)
                    : 'transparent',
                  transition: 'background-color 0.15s',
                  borderRadius: '4px',
                }}
              >
                {(column.tasks ?? []).map((task, taskIndex) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={taskIndex}
                    boardId={board.id}
                    isPending={task.id === pendingTaskId}
                    isDragDisabled={isTaskDragDisabled}
                    canEdit={canEditBoardContent}
                  />
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>

          {canEditBoardContent && isAddingTask ? (
            <Box sx={{ px: 1.5, pb: 1.5 }}>
              <TextField
                autoFocus
                size="small"
                fullWidth
                multiline
                maxRows={4}
                placeholder={t('taskPlaceholder')}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddTask();
                  }
                  if (e.key === 'Escape') setAddingTaskInColumn(null);
                }}
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAddTask}
                  disabled={createTask.isPending}
                >
                  {t('add')}
                </Button>
                <Button
                  size="small"
                  onClick={() => setAddingTaskInColumn(null)}
                >
                  {t('cancel')}
                </Button>
              </Box>
            </Box>
          ) : canEditBoardContent ? (
            <Box sx={{ px: 1.5, pb: 1.5 }}>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => setAddingTaskInColumn(column.id)}
                sx={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  color: 'text.secondary',
                }}
              >
                {t('addTask')}
              </Button>
            </Box>
          ) : null}

          {canManageColumns && (
            <Menu
              anchorEl={menuAnchor}
              open={!!menuAnchor}
              onClose={() => setMenuAnchor(null)}
            >
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  setIsEditingTitle(true);
                }}
              >
                <Edit fontSize="small" sx={{ mr: 1 }} /> {t('rename')}
              </MenuItem>
              <MenuItem
                onClick={handleDeleteColumn}
                sx={{ color: 'error.main' }}
              >
                <Delete fontSize="small" sx={{ mr: 1 }} /> {t('delete')}
              </MenuItem>
            </Menu>
          )}
        </Paper>
      )}
    </Draggable>
  );
};

export default KanbanColumn;
