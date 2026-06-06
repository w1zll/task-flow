'use client';

import { create } from 'zustand';

interface BoardUIState {
  isDragging: boolean;
  draggingTaskId: string | null;
  openTaskId: string | null;
  isAddingColumn: boolean;
  addingTaskInColumnId: string | null;
  startDrag: (taskId: string) => void;
  endDrag: () => void;
  openTask: (taskId: string) => void;
  closeTask: () => void;
  setAddingColumn: (value: boolean) => void;
  setAddingTaskInColumn: (columnId: string | null) => void;
}

export const useBoardUIStore = create<BoardUIState>((set) => ({
  isDragging: false,
  draggingTaskId: null,
  openTaskId: null,
  isAddingColumn: false,
  addingTaskInColumnId: null,
  startDrag: (taskId) => set({ isDragging: true, draggingTaskId: taskId }),
  endDrag: () => set({ isDragging: false, draggingTaskId: null }),
  openTask: (taskId) => set({ openTaskId: taskId }),
  closeTask: () => set({ openTaskId: null }),
  setAddingColumn: (value) => set({ isAddingColumn: value }),
  setAddingTaskInColumn: (columnId) =>
    set({ addingTaskInColumnId: columnId }),
}));
