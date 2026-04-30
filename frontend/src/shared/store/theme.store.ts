import { makeAutoObservable } from 'mobx';

type ThemeMode = 'light' | 'dark';

export class ThemeStore {
  mode: ThemeMode = 'dark';

  constructor() {
    makeAutoObservable(this);

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as ThemeMode | null;
      if (saved) this.mode = saved;
    }
  }

  toggle() {
    this.mode = this.mode === 'light' ? 'dark' : 'light';
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', this.mode);
    }
  }

  get isDark() {
    return this.mode === 'dark';
  }
}
