import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '../stores/notificationStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const initSocket = (token?: string): Socket => {
  const authToken = token || localStorage.getItem('taskflow_token');

  if (socket) {
    if (authToken && socket.auth && (socket.auth as any).token !== authToken) {
      socket.disconnect();
    } else if (socket.connected) {
      return socket;
    }
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: authToken ? `Bearer ${authToken}` : undefined,
    },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected with ID:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket] Connection error:', error.message);
  });

  // Global Real-time Notification listener
  socket.on('notification:new', (notification) => {
    console.log('[Socket] New notification received:', notification);
    useNotificationStore.getState().addNotification({
      id: notification.id || Math.random().toString(),
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      isRead: false,
      createdAt: notification.createdAt || new Date().toISOString(),
    });
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
    socket.disconnect();
    socket = null;
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
