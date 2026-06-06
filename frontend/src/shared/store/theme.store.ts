'use client';

import { create } from 'zustand';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  toggle: () => void;
}

const getInitialMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';

  const saved = localStorage.getItem('theme') as ThemeMode | null;
  return saved ?? 'dark';
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const mode = getInitialMode();

  return {
    mode,
    isDark: mode === 'dark',
    toggle: () => {
      const nextMode = get().mode === 'light' ? 'dark' : 'light';

      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', nextMode);
      }

      set({ mode: nextMode, isDark: nextMode === 'dark' });
    },
  };
});
