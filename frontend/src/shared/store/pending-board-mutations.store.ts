'use client';

import { create } from 'zustand';

export type BoardSocketEvent = 'task:update' | 'task:move' | 'task:reorder';

export type PendingBoardMutation = {
  id: string;
  boardId: string;
  event: BoardSocketEvent;
  payload: unknown;
  createdAt: number;
};

interface PendingBoardMutationsState {
  mutations: PendingBoardMutation[];
  enqueue: (mutation: PendingBoardMutation) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const usePendingBoardMutationsStore =
  create<PendingBoardMutationsState>((set) => ({
    mutations: [],
    enqueue: (mutation) =>
      set((state) => ({
        mutations: [...state.mutations, mutation],
      })),
    remove: (id) =>
      set((state) => ({
        mutations: state.mutations.filter((mutation) => mutation.id !== id),
      })),
    clear: () => set({ mutations: [] }),
  }));
