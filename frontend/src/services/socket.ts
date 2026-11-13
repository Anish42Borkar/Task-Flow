import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '../stores/notificationStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;
let currentToken: string | null = null;

export const initSocket = (token?: string): Socket => {
  const authToken = token || localStorage.getItem('taskflow_token');

  // If socket is already established with the same token, reuse it
  if (socket && currentToken === authToken && (socket.connected || socket.active)) {
    return socket;
  }

  // If token changed or reinitializing, cleanly disconnect previous socket
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  currentToken = authToken || null;

  socket = io(SOCKET_URL, {
    auth: {
      token: authToken ? `Bearer ${authToken}` : undefined,
    },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected with ID:', socket?.id);
    const storedUserStr = localStorage.getItem('taskflow_user');
    if (storedUserStr) {
      try {
        const u = JSON.parse(storedUserStr);
        if (u?.id) {
          socket?.emit('user:join', { userId: u.id });
        }
      } catch (e) {}
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket] Connection error:', error.message);
  });

  // Global Real-time Notification listener (SINGLE source of truth for in-app notifications and popups)
  socket.on('notification:new', (notification: any) => {
    console.log('[Socket] New notification received:', notification);
    if (!notification) return;

    useNotificationStore.getState().addNotification({
      id: notification.id || Math.random().toString(),
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      referenceId: notification.referenceId,
      isRead: false,
      createdAt: notification.createdAt || new Date().toISOString(),
    });
  });

  // Project assigned listener: notify pages to reload project list, without creating duplicate popups
  socket.on('project:assigned', (data: any) => {
    console.log('[Socket] Project assigned event received:', data);
    useNotificationStore.getState().fetchNotifications();
    window.dispatchEvent(new CustomEvent('taskflow:project_assigned', { detail: data }));
  });

  // Project removed listener
  socket.on('project:removed', (data: any) => {
    console.log('[Socket] Project removed:', data);
    useNotificationStore.getState().fetchNotifications();
    window.dispatchEvent(new CustomEvent('taskflow:project_assigned', { detail: data }));
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
};

export const joinProjectRoom = (projectId: string) => {
  const s = getSocket();
  if (s) {
    s.emit('project:join', { projectId });
  }
};

export const leaveProjectRoom = (projectId: string) => {
  const s = getSocket();
  if (s) {
    s.emit('project:leave', { projectId });
  }
};
