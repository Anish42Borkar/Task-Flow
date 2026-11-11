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

// Synchronously read stored session to prevent unauthenticated redirect on page reload
const getStoredSession = () => {
  try {
    const token = localStorage.getItem('taskflow_token');
    const storedUser = localStorage.getItem('taskflow_user');
    if (token && storedUser) {
      const user = JSON.parse(storedUser);
      return { user, token, isAuthenticated: true, isLoading: false };
    }
  } catch (err) {
    console.error('Error reading auth from localStorage:', err);
  }
  return { user: null, token: null, isAuthenticated: false, isLoading: false };
};

const initial = getStoredSession();

export const useAuthStore = create<AuthState>((set) => ({
  user: initial.user,
  token: initial.token,
  isAuthenticated: initial.isAuthenticated,
  isLoading: initial.isLoading,

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
    const session = getStoredSession();
    set(session);
  },
}));
