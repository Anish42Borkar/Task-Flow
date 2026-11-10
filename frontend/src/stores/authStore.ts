import { create } from 'zustand';
import { User, RoleType } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user: User, token: string) => {
    localStorage.setItem('taskflow_token', token);
    localStorage.setItem('taskflow_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  setUser: (user: User) => {
    localStorage.setItem('taskflow_user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  initialize: () => {
    try {
      const token = localStorage.getItem('taskflow_token');
      const storedUser = localStorage.getItem('taskflow_user');
      if (token && storedUser) {
        const user = JSON.parse(storedUser);
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        // Fallback default demo user if not logged in yet for testing UI
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
