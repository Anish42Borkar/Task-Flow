import { create } from 'zustand';
import { NotificationItem } from '../types';

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
  toasts: ToastMessage[];
  addToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  setNotifications: (items: NotificationItem[]) => void;
  addNotification: (item: NotificationItem) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [
    {
      id: '1',
      userId: 'u1',
      title: 'Task assigned to you',
      message: 'You have been assigned a new task "Update project documentation" by Rohit Sharma.',
      type: 'task_assigned',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: '2',
      userId: 'u1',
      title: 'New user added',
      message: 'Priya Desai has been added to the project "Website Redesign".',
      type: 'project_updated',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    },
    {
      id: '3',
      userId: 'u1',
      title: 'Project updated',
      message: 'The project "Mobile App" has been updated by Amit Patil.',
      type: 'project_updated',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
    {
      id: '4',
      userId: 'u1',
      title: 'Task completed',
      message: '"Integrate authentication" has been marked as completed by Neha Kulkarni.',
      type: 'task_completed',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ],
  unreadCount: 3,
  toasts: [],

  addToast: (title, message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, title, message, type, timestamp: Date.now() };
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
    set({ notifications: items, unreadCount: unread });
  },

  addNotification: (item) => {
    set((state) => ({
      notifications: [item, ...state.notifications],
      unreadCount: item.isRead ? state.unreadCount : state.unreadCount + 1,
    }));
    get().addToast(item.title, item.message, 'info');
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },
}));
