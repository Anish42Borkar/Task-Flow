import { create } from 'zustand';
import { User, RolePermission } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  permissions: RolePermission[];
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string, refreshToken?: string, permissions?: RolePermission[]) => void;
  setTokens: (token: string, refreshToken?: string) => void;
  setUser: (user: User) => void;
  setPermissions: (permissions: RolePermission[]) => void;
  fetchProfile: () => Promise<void>;
  hasPermission: (module: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => boolean;
  logout: () => void;
  initialize: () => void;
}

// Synchronously read stored session to prevent unauthenticated redirect on page reload
const getStoredSession = () => {
  try {
    const token = localStorage.getItem('taskflow_token');
    const refreshToken = localStorage.getItem('taskflow_refresh_token');
    const storedUser = localStorage.getItem('taskflow_user');
    const storedPerms = localStorage.getItem('taskflow_permissions');
    const permissions: RolePermission[] = storedPerms ? JSON.parse(storedPerms) : [];
    if (token && storedUser) {
      const user = JSON.parse(storedUser);
      return { user, permissions, token, refreshToken, isAuthenticated: true, isLoading: false };
    }
  } catch (err) {
    console.error('Error reading auth from localStorage:', err);
  }
  return { user: null, permissions: [] as RolePermission[], token: null, refreshToken: null, isAuthenticated: false, isLoading: false };
};

const initial = getStoredSession();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initial.user,
  permissions: initial.permissions,
  token: initial.token,
  refreshToken: initial.refreshToken,
  isAuthenticated: initial.isAuthenticated,
  isLoading: initial.isLoading,

  setAuth: (user: User, token: string, refreshToken?: string, permissions?: RolePermission[]) => {
    localStorage.setItem('taskflow_token', token);
    localStorage.setItem('taskflow_user', JSON.stringify(user));
    if (permissions) {
      localStorage.setItem('taskflow_permissions', JSON.stringify(permissions));
    }
    if (refreshToken) {
      localStorage.setItem('taskflow_refresh_token', refreshToken);
    }
    set({
      user,
      token,
      permissions: permissions || get().permissions || [],
      refreshToken: refreshToken || get().refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
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

  setPermissions: (permissions: RolePermission[]) => {
    localStorage.setItem('taskflow_permissions', JSON.stringify(permissions));
    set({ permissions });
  },

  fetchProfile: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const data: any = await api.get('/auth/me');
      const freshUser = data?.user || data;
      const freshPerms = data?.permissions || [];
      localStorage.setItem('taskflow_user', JSON.stringify(freshUser));
      localStorage.setItem('taskflow_permissions', JSON.stringify(freshPerms));
      set({ user: freshUser, permissions: freshPerms });
    } catch (err) {
      console.warn('Failed to refresh user profile & permissions:', err);
    }
  },

  hasPermission: (module: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    const { user, permissions } = get();
    if (!user) return false;

    // Superuser admin has universal access
    if (user.role === 'admin') return true;

    // Viewer role is strictly read-only
    if (user.role === 'viewer') {
      if (action !== 'canView') return false;
      return module === 'projects' || module === 'tasks' || module === 'notifications';
    }

    const perm = permissions.find((p) => p.module === module);
    if (!perm) return false;

    return Boolean(perm[action]);
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
    localStorage.removeItem('taskflow_permissions');
    set({ user: null, permissions: [], token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  },

  initialize: () => {
    const session = getStoredSession();
    set(session);
    if (session.isAuthenticated) {
      get().fetchProfile();
    }
  },
}));
