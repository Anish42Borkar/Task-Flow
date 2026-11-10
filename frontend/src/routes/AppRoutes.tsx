import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { AppLayout } from '../layouts/AppLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ProjectsPage } from '../pages/projects/ProjectsPage';
import { TasksPage } from '../pages/tasks/TasksPage';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { PermissionsPage } from '../pages/admin/PermissionsPage';
import { NotificationsPage } from '../pages/notifications/NotificationsPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { MyProfilePage } from '../pages/profile/MyProfilePage';

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Main Layout Protected Routes */}
      <Route
        path="/"
        element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<MyProfilePage />} />

        {/* Admin Exclusive Routes */}
        {isAdmin && (
          <>
            <Route path="users" element={<UserManagementPage />} />
            <Route path="permissions" element={<PermissionsPage />} />
          </>
        )}
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
};
