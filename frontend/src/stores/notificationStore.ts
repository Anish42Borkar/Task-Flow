import { create } from 'zustand';
import { NotificationItem } from '../types';
import { api } from '../services/api';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  toasts: ToastMessage[];
  addToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  setNotifications: (items: NotificationItem[]) => void;
  addNotification: (item: NotificationItem, showToast?: boolean) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  toasts: [],

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const res: any = await api.get('/notifications');
      const items = Array.isArray(res) ? res : res?.notifications || [];

      set((state) => {
        // Keep any newly added local notifications (created in last 10s) that aren't yet in server items
        const now = Date.now();
        const localRecent = state.notifications.filter((n) => {
          const itemExists = items.some(
            (i: any) =>
              i.id === n.id ||
              (i.title === n.title && i.referenceId && i.referenceId === n.referenceId),
          );
          if (itemExists) return false;
          const age = now - new Date(n.createdAt).getTime();
          return age < 10000;
        });

        const combined = [...localRecent, ...items];
        const count = combined.filter((n: any) => !n.isRead).length;

        return { notifications: combined, unreadCount: count, isLoading: false };
      });
    } catch (err) {
      console.warn('Failed to fetch notifications from backend:', err);
      set({ isLoading: false });
    }
  },

  addToast: (title, message, type = 'info') => {
    const now = Date.now();
    // Anti-duplicate protection: avoid spamming identical popups within 2 seconds
    const isDuplicate = get().toasts.some(
      (t) =>
        t.title.trim().toLowerCase() === title.trim().toLowerCase() &&
        t.message.trim().toLowerCase() === message.trim().toLowerCase() &&
        now - t.timestamp < 2000,
    );
    if (isDuplicate) return;

    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, title, message, type, timestamp: now };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4500);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  setNotifications: (items) => {
    const unread = items.filter((n) => !n.isRead).length;
    set({ notifications: items, unreadCount: unread, isLoading: false });
  },

  addNotification: (item, showToast = true) => {
    set((state) => {
      // Prevent duplicate notification addition
      const exists = state.notifications.some((n) => n.id === item.id);
      if (exists) return state;
      return {
        notifications: [item, ...state.notifications],
        unreadCount: item.isRead ? state.unreadCount : state.unreadCount + 1,
      };
    });

    if (showToast) {
      let toastType: ToastMessage['type'] = 'info';
      if (
        item.type === 'project_assigned' ||
        item.type === 'task_completed' ||
        item.type === 'success'
      ) {
        toastType = 'success';
      } else if (item.type === 'error') {
        toastType = 'error';
      } else if (item.type === 'warning') {
        toastType = 'warning';
      }
      get().addToast(item.title, item.message, toastType);
    }
  },

  markAsRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.warn('Failed to mark notification read on backend:', err);
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await api.patch('/notifications/read-all');
    } catch (err) {
      console.warn('Failed to mark all notifications read on backend:', err);
    }
  },

  deleteNotification: async (id: string) => {
    const target = get().notifications.find((n) => n.id === id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount:
        target && !target.isRead ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    }));
    try {
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      console.warn('Failed to delete notification on backend:', err);
    }
  },

  clearAllNotifications: async () => {
    set({ notifications: [], unreadCount: 0 });
    try {
      await api.delete('/notifications/clear-all');
      get().addToast('Cleared', 'All notifications have been removed', 'info');
    } catch (err) {
      console.warn('Failed to clear notifications on backend:', err);
    }
  },
}));
