import { createContext, useContext } from 'react';
import { AuthStore } from './auth.store';
import { BoardUIStore } from './board-ui.store';
import { ThemeStore } from './theme.store';

export class RootStore {
  auth: AuthStore;
  theme: ThemeStore;
  boardUI: BoardUIStore;

  constructor() {
    this.auth = new AuthStore();
    this.theme = new ThemeStore();
    this.boardUI = new BoardUIStore();
  }
}

let _store: RootStore | null = null;

export const getRootStore = (): RootStore => {
  if (!_store) _store = new RootStore();
  return _store;
};

export const StoreContext = createContext<RootStore | null>(null);

export const useStore = (): RootStore => {
  const store = useContext(StoreContext);
  if (!store)
    throw new Error('useStore должен быть использован внутри StoreProvider');
  return store;
};

export const useAuthStore = () => useStore().auth;

export const useThemeStore = () => useStore().theme;

export const useBoardUIStore = () => useStore().boardUI;
