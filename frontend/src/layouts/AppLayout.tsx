import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { ToastContainer } from '../components/feedback/ToastContainer';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

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
              TaskFlow
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
            <button
              onClick={() => navigate('/notifications')}
              style={{
                position: 'relative',
                color: '#64748b',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#ef4444',
                    borderRadius: '50%',
                  }}
                />
              )}
            </button>

            {/* User Profile Pill */}
            <div style={{ position: 'relative' }}>
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
