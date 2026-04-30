import { makeAutoObservable, runInAction } from 'mobx';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export class AuthStore {
  user: AuthUser | null = null;
  isLoading = true;

  constructor() {
    makeAutoObservable(this);
  }

  get isAuthenticated() {
    return this.user !== null;
  }

  setUser(user: AuthUser | null) {
    this.user = user;
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  hydrate(user: AuthUser | null) {
    runInAction(() => {
      this.user = user;
      this.isLoading = false;
    });
  }

  logout() {
    this.user = null;
  }
}
