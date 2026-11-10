import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { AppRoutes } from './routes/AppRoutes';
import { initSocket, disconnectSocket } from './services/socket';

export const App: React.FC = () => {
  const { initialize, isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated && token) {
      initSocket(token);
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, token]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
