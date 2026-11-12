import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  setTokens: (token: string, refreshToken?: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  initialize: () => void;
}

// Synchronously read stored session to prevent unauthenticated redirect on page reload
const getStoredSession = () => {
  try {
    const token = localStorage.getItem('taskflow_token');
    const refreshToken = localStorage.getItem('taskflow_refresh_token');
    const storedUser = localStorage.getItem('taskflow_user');
    if (token && storedUser) {
      const user = JSON.parse(storedUser);
      return { user, token, refreshToken, isAuthenticated: true, isLoading: false };
    }
  } catch (err) {
    console.error('Error reading auth from localStorage:', err);
  }
  return { user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false };
};

const initial = getStoredSession();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initial.user,
  token: initial.token,
  refreshToken: initial.refreshToken,
  isAuthenticated: initial.isAuthenticated,
  isLoading: initial.isLoading,

  setAuth: (user: User, token: string, refreshToken?: string) => {
    localStorage.setItem('taskflow_token', token);
    localStorage.setItem('taskflow_user', JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem('taskflow_refresh_token', refreshToken);
    }
    set({ user, token, refreshToken: refreshToken || get().refreshToken, isAuthenticated: true, isLoading: false });
  },

  setTokens: (token: string, refreshToken?: string) => {
    localStorage.setItem('taskflow_token', token);
    if (refreshToken) {
      localStorage.setItem('taskflow_refresh_token', refreshToken);
    }
    set({ token, refreshToken: refreshToken || get().refreshToken });
  },

  setUser: (user: User) => {
    localStorage.setItem('taskflow_user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    const refreshToken = localStorage.getItem('taskflow_refresh_token');
    if (refreshToken) {
      // Fire-and-forget server side revocation
      fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => null);
    }
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_refresh_token');
    localStorage.removeItem('taskflow_user');
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  },

  initialize: () => {
    const session = getStoredSession();
    set(session);
  },
}));
