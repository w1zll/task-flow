'use client';

import { create } from 'zustand';
import { writeStoredAuthUser } from '@/shared/lib/auth-session';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  activeWorkspaceId?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  hydrate: (user: AuthUser | null) => void;
  logout: () => void;
  setActiveWorkspace: (workspaceId: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => {
    writeStoredAuthUser(user);
    set({ user, isAuthenticated: user !== null });
  },
  setLoading: (loading) => set({ isLoading: loading }),
  hydrate: (user) => {
    writeStoredAuthUser(user);
    set({
      user,
      isLoading: false,
      isAuthenticated: user !== null,
    });
  },
  logout: () => {
    writeStoredAuthUser(null);
    set({ user: null, isAuthenticated: false });
  },
  setActiveWorkspace: (activeWorkspaceId) =>
    set((state) => {
      const user = state.user ? { ...state.user, activeWorkspaceId } : null;
      writeStoredAuthUser(user);
      return { user };
    }),
}));
