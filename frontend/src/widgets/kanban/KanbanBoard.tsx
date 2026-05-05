'use client';

import { useState, useEffect } from 'react';
import { Board, columnsApi, taskApi } from '@/shared/api/api';
import { queryKeys } from '@/shared/queries/boards.queries';
import { useBoardUIStore } from '@/shared/store/root.store';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import KanbanColumn from './KanbanColumn';
import { Box } from '@mui/material';

interface Props {
  board: Board;
}

const KanbanBoard = ({ board }: Props) => {
  const boardUI = useBoardUIStore();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [localBoard, setLocalBoard] = useState<Board>(board);

  useEffect(() => {
    setLocalBoard(board);
  }, [board]);

  const handleDragStart = (start: any) => {
    if (start.type === 'TASK') {
      boardUI.startDrag(start.draggableId);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    boardUI.endDrag();
    const { source, destination, type, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    const previousBoard = localBoard;

    if (type === 'COLUMN') {
      const cols = Array.from(localBoard.columns ?? []);
      const [moved] = cols.splice(source.index, 1);
      cols.splice(destination.index, 0, moved);

      const newBoard = {
        ...localBoard,
        columns: cols,
      };

      setLocalBoard(newBoard);

      try {
        const newIds = cols.map((c) => c.id);
        await columnsApi.reorder(board.id, newIds);
        qc.setQueryData(queryKeys.board(board.id), newBoard);
        qc.invalidateQueries({ queryKey: queryKeys.board(board.id) });
      } catch (error) {
        setLocalBoard(previousBoard);
        enqueueSnackbar('Ошибка перемещения колонок', { variant: 'error' });
      }

      return;
    }

    const srcColId = source.droppableId;
    const dstColId = destination.droppableId;
    const isSameColumn = srcColId === dstColId;

    const computeNewBoard = (prev: Board): Board => {
      const columns = prev.columns!.map((c) => ({
        ...c,
        tasks: Array.from(c.tasks ?? []),
      }));

      const srcCol = columns.find((c) => c.id === srcColId);
      const dstCol = columns.find((c) => c.id === dstColId);

      if (!srcCol || !dstCol) return prev;

      const srcTasks = Array.from(srcCol.tasks ?? []);
      const [movedTask] = srcTasks.splice(source.index, 1);

      if (isSameColumn) {
        srcTasks.splice(destination.index, 0, movedTask);

        return {
          ...prev,
          columns: columns.map((c) =>
            c.id === srcColId ? { ...c, tasks: srcTasks } : c,
          ),
        };
      } else {
        const dstTasks = Array.from(dstCol.tasks ?? []);

        dstTasks.splice(destination.index, 0, {
          ...movedTask,
          columnId: dstColId,
        });

        return {
          ...prev,
          columns: columns.map((c) => {
            if (c.id === srcColId) return { ...c, tasks: srcTasks };
            if (c.id === dstColId) return { ...c, tasks: dstTasks };
            return c;
          }),
        };
      }
    };

    const newBoard = computeNewBoard(localBoard);
    setLocalBoard(newBoard);

    try {
      if (isSameColumn) {
        const col = newBoard.columns?.find((c) => c.id === srcColId);
        if (col?.tasks) {
          await taskApi.reorder(
            srcColId,
            col.tasks.map((t) => t.id),
          );
        }
      } else {
        await taskApi.move(draggableId, {
          columnId: dstColId,
          order: destination.index,
        });
      }
      qc.setQueryData(queryKeys.board(board.id), newBoard);
      qc.invalidateQueries({ queryKey: queryKeys.board(board.id) });
    } catch (error) {
      setLocalBoard(previousBoard);
      enqueueSnackbar('Не удалось переместить задачу', { variant: 'error' });
    }
  };

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Droppable
        droppableId="board-columns"
        type="COLUMN"
        direction="horizontal"
      >
        {(provided) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}
          >
            {(localBoard.columns ?? []).map((col, index) => (
              <KanbanColumn
                key={col.id}
                column={col}
                board={localBoard}
                index={index}
              />
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default KanbanBoard;
