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

  // Global Real-time Notification listener
  socket.on('notification:new', (notification: any) => {
    console.log('[Socket] New notification received:', notification);
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

  // Project assigned listener - popup message and store update
  socket.on('project:assigned', (data: any) => {
    console.log('[Socket] Project assigned event received:', data);
    const title = data.title || 'Project Assigned';
    const message =
      data.message ||
      (data.projectName
        ? `You have been assigned to project "${data.projectName}".`
        : 'You have been assigned to a project.');

    // Display instant popup toast message
    useNotificationStore.getState().addToast(title, message, 'success');

    // Add to in-app notification center
    useNotificationStore.getState().addNotification({
      id: data.notification?.id || Math.random().toString(),
      userId: data.notification?.userId || 'me',
      title,
      message,
      type: 'project_assigned',
      referenceId: data.projectId,
      isRead: false,
      createdAt: data.notification?.createdAt || new Date().toISOString(),
    });

    // Refresh full notification count and list
    useNotificationStore.getState().fetchNotifications();

    // Notify any active page components (e.g., ProjectsPage) to auto-reload project list
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
