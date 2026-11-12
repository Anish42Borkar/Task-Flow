import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Folder,
  CheckSquare,
  Users,
  ShieldCheck,
  Bell,
  Settings,
  LogOut,
  Search,
  Menu,
  ChevronDown,
  User as UserIcon,
  Check,
  CheckCheck,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useSettingsStore } from '../stores/settingsStore';
import { ToastContainer } from '../components/feedback/ToastContainer';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { appName, fetchSettings } = useSettingsStore();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      fetchSettings();
    }
  }, [user?.id, fetchNotifications, fetchSettings]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Nav item style helper
  const getNavLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
    color: isActive ? '#ffffff' : '#94a3b8',
    backgroundColor: isActive ? '#4f46e5' : 'transparent',
    transition: 'all 0.15s ease',
    textDecoration: 'none',
    position: 'relative',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Dark Navy Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? '260px' : '80px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
          zIndex: 40,
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            gap: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Check size={22} strokeWidth={3} />
          </div>
          {sidebarOpen && (
            <span style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.3px' }}>
              {appName || 'TaskFlow'}
            </span>
          )}
        </div>

        {/* Navigation Links */}
        <nav
          style={{
            flex: 1,
            padding: '20px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            overflowY: 'auto',
          }}
        >
          <NavLink to="/dashboard" style={getNavLinkStyle}>
            <LayoutDashboard size={20} />
            {sidebarOpen && <span>Dashboard</span>}
          </NavLink>

          <NavLink to="/projects" style={getNavLinkStyle}>
            <Folder size={20} />
            {sidebarOpen && <span>Projects</span>}
          </NavLink>

          <NavLink to="/tasks" style={getNavLinkStyle}>
            <CheckSquare size={20} />
            {sidebarOpen && <span>Tasks</span>}
          </NavLink>

          {isAdmin && (
            <>
              <NavLink to="/users" style={getNavLinkStyle}>
                <Users size={20} />
                {sidebarOpen && <span>User Management</span>}
              </NavLink>

              <NavLink to="/permissions" style={getNavLinkStyle}>
                <ShieldCheck size={20} />
                {sidebarOpen && <span>Permissions</span>}
              </NavLink>
            </>
          )}

          <NavLink to="/notifications" style={getNavLinkStyle}>
            <Bell size={20} />
            {sidebarOpen && <span>Notifications</span>}
            {unreadCount > 0 && sidebarOpen && (
              <span
                style={{
                  marginLeft: 'auto',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: '9999px',
                }}
              >
                {unreadCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/settings" style={getNavLinkStyle}>
            <Settings size={20} />
            {sidebarOpen && <span>Settings</span>}
          </NavLink>
        </nav>

        {/* Logout Action at Bottom */}
        <div
          style={{
            padding: '16px 14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 16px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#94a3b8',
              width: '100%',
              transition: 'all 0.15s ease',
            }}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header
          style={{
            height: '70px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Left section: Toggle & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '500px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                color: '#64748b',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Menu size={20} />
            </button>

            {/* Search Input with Ctrl + K */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '8px 14px',
                width: '100%',
                maxWidth: '360px',
              }}
            >
              <Search size={16} color="#94a3b8" style={{ marginRight: '8px' }} />
              <input
                type="text"
                placeholder="Search anything..."
                style={{
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '13.5px',
                  width: '100%',
                  color: '#0f172a',
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#94a3b8',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '2px 6px',
                  whiteSpace: 'nowrap',
                }}
              >
                Ctrl + K
              </span>
            </div>
          </div>

          {/* Right section: Notification Bell & Profile dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Notification Bell Dropdown */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                style={{
                  position: 'relative',
                  color: notificationDropdownOpen ? '#4f46e5' : '#64748b',
                  backgroundColor: notificationDropdownOpen ? '#eef2ff' : 'transparent',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      minWidth: '16px',
                      height: '16px',
                      padding: '0 4px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      borderRadius: '9999px',
                      fontSize: '10px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {notificationDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '46px',
                    width: '360px',
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.15)',
                    zIndex: 50,
                    overflow: 'hidden',
                  }}
                >
                  {/* Popover Header */}
                  <div
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#4f46e5',
                            backgroundColor: '#eef2ff',
                            padding: '1px 8px',
                            borderRadius: '9999px',
                          }}
                        >
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllAsRead()}
                        style={{
                          fontSize: '12px',
                          color: '#4f46e5',
                          fontWeight: 600,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCheck size={14} />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Popover Notification List */}
                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8' }}>
                        <Bell size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>No notifications yet</div>
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (!item.isRead) markAsRead(item.id);
                          }}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #f8fafc',
                            backgroundColor: item.isRead ? '#ffffff' : '#f0f7ff',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start',
                          }}
                        >
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: item.type.startsWith('task')
                                ? '#eef2ff'
                                : item.type.startsWith('project')
                                ? '#ecfdf5'
                                : '#f1f5f9',
                              color: item.type.startsWith('task')
                                ? '#4f46e5'
                                : item.type.startsWith('project')
                                ? '#10b981'
                                : '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: '2px',
                            }}
                          >
                            {item.type.startsWith('task') ? (
                              <CheckSquare size={16} />
                            ) : item.type.startsWith('project') ? (
                              <Layers size={16} />
                            ) : (
                              <Bell size={16} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '13px',
                                fontWeight: item.isRead ? 600 : 700,
                                color: '#0f172a',
                              }}
                            >
                              {item.title}
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#475569',
                                marginTop: '2px',
                                lineHeight: 1.4,
                              }}
                            >
                              {item.message}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                              {new Date(item.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                          {!item.isRead && (
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                backgroundColor: '#4f46e5',
                                flexShrink: 0,
                                marginTop: '6px',
                              }}
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Popover Footer */}
                  <div
                    style={{
                      padding: '10px 16px',
                      borderTop: '1px solid #f1f5f9',
                      backgroundColor: '#f8fafc',
                      textAlign: 'center',
                    }}
                  >
                    <button
                      onClick={() => {
                        setNotificationDropdownOpen(false);
                        navigate('/notifications');
                      }}
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: '#4f46e5',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      View all notifications
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '4px 8px',
                  borderRadius: '10px',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {user?.fullName
                    ? user.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                    : 'AB'}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                    {user?.fullName || 'Anish Borkar'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', textTransform: 'capitalize' }}>
                    {user?.role || 'Admin'}
                  </div>
                </div>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '48px',
                    width: '200px',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '8px',
                    zIndex: 50,
                  }}
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <button
                    onClick={() => navigate('/profile')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      width: '100%',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      color: '#334155',
                      fontWeight: 500,
                    }}
                  >
                    <UserIcon size={16} />
                    My Profile
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      width: '100%',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      color: '#334155',
                      fontWeight: 500,
                    }}
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                  <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      width: '100%',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      color: '#ef4444',
                      fontWeight: 500,
                    }}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Global Real-time Toast Alerts */}
      <ToastContainer />
    </div>
  );
};
