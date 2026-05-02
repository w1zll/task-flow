'use client';

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
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const boardUI = useBoardUIStore();

  const handleDragStart = (start: any) => {
    if (start.type === 'TASK') boardUI.startDrag(start.draggableId);
  };

  const handleDragEnd = async (result: DropResult) => {
    boardUI.endDrag();
    const { source, destination, type, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    if (type === 'COLUMN') {
      const cols = Array.from(board.columns ?? []);
      const [moved] = cols.splice(source.index, 1);
      cols.splice(destination.index, 0, moved);
      const newIds = cols.map((c) => c.id);

      qc.setQueryData<Board>(queryKeys.board(board.id), (old) => {
        if (!old) return old;
        const reordered = newIds.map(
          (id) => old.columns!.find((c) => c.id === id)!,
        );
        return { ...old, columns: reordered };
      });

      try {
        await columnsApi.reorder(board.id, newIds);
      } catch {
        qc.invalidateQueries({ queryKey: queryKeys.board(board.id) });
        enqueueSnackbar('Ошибка перемещения колонок', { variant: 'error' });
      }
      return;
    }

    const srcColId = source.droppableId;
    const dstColId = destination.droppableId;
    const isSameColumn = srcColId === dstColId;

    qc.setQueryData<Board>(queryKeys.board(board.id), (old) => {
      if (!old) return old;
      const columns = old.columns!.map((c) => ({
        ...c,
        tasks: Array.from(c.tasks ?? []),
      }));

      const srcCol = columns.find((c) => c.id === srcColId);
      const dstCol = columns.find((c) => c.id === dstColId);
      if (!srcCol || !dstCol) return old;

      const srcTasks = Array.from(srcCol.tasks ?? []);
      const [movedTask] = srcTasks.splice(source.index, 1);

      if (isSameColumn) {
        srcTasks.splice(destination.index, 0, movedTask);
        return {
          ...old,
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
          ...old,
          columns: columns.map((c) => {
            if (c.id === srcColId) return { ...c, tasks: srcTasks };
            if (c.id === dstColId) return { ...c, tasks: dstTasks };
            return c;
          }),
        };
      }
    });

    try {
      if (isSameColumn) {
        const updatedBoard = qc.getQueryData<Board>(queryKeys.board(board.id));
        const col = board.columns?.find((c) => c.id === srcColId);
        if (col) {
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
    } catch {
      qc.invalidateQueries({ queryKey: queryKeys.board(board.id) });
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
            {(board.columns ?? []).map((col, index) => (
              <KanbanColumn
                key={col.id}
                column={col}
                board={board}
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

// const ColumnsDroppable = ({ board }: { board: Board }) => {
//   return (
//     <Droppable droppableId="all-columns" type="COLUMN" direction="horizontal">
//       {(provided) => (
//         <div
//           ref={provided.innerRef}
//           {...provided.droppableProps}
//           style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
//         >
//           {(board.columns ?? []).map((col, index) => (
//             <KanbanColumn
//               key={col.id}
//               column={col}
//               index={index}
//               board={board}
//             />
//           ))}
//         </div>
//       )}
//     </Droppable>
//   );
// };
