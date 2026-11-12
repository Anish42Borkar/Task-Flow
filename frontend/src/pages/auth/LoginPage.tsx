import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Zap,
  Users,
  BarChart3,
  Check,
  AlertCircle,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import './auth.css';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('anish.borkar@example.com');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent, overrideEmail?: string, overridePassword?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const loginEmail = overrideEmail || email;
    const loginPassword = overridePassword || password;

    try {
      const res: any = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });

      if (res?.accessToken && res?.user) {
        setAuth(res.user, res.accessToken, res.refreshToken);
        navigate('/dashboard');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const loginAs = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      const e = 'anish.borkar@example.com';
      const p = 'Password123!';
      setEmail(e);
      setPassword(p);
      handleLogin(undefined, e, p);
    } else {
      const e = 'rahul@taskflow.com';
      const p = 'Password123!';
      setEmail(e);
      setPassword(p);
      handleLogin(undefined, e, p);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Gradient Hero Panel (visible on desktop) */}
      <div className="auth-hero-panel">
        {/* Brand Header */}
        <div className="auth-hero-brand">
          <div className="auth-hero-brand-icon">
            <Check size={24} strokeWidth={3} />
          </div>
          <span className="auth-hero-brand-name">TaskFlow</span>
        </div>

        {/* Hero Content & Kanban Illustration Graphic */}
        <div className="auth-hero-body">
          <h1 className="auth-hero-title">
            Manage Projects,<br />Tasks and Teams
          </h1>
          <p className="auth-hero-subtitle">
            A simple and collaborative task management platform for your team.
          </p>

          {/* Kanban Board Graphic Card */}
          <div className="auth-kanban-card">
            <div className="auth-kanban-grid">
              {/* Column 1: Pending */}
              <div className="auth-kanban-column">
                <div className="auth-kanban-col-header">
                  <span>Pending</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>2</span>
                </div>
                <div className="auth-kanban-task pending">
                  <div className="auth-kanban-bar" />
                </div>
                <div className="auth-kanban-task pending">
                  <div className="auth-kanban-bar" style={{ width: '50%' }} />
                </div>
              </div>

              {/* Column 2: In Progress */}
              <div className="auth-kanban-column">
                <div className="auth-kanban-col-header">
                  <span>In Progress</span>
                  <span style={{ fontSize: '11px', color: '#3b82f6' }}>2</span>
                </div>
                <div className="auth-kanban-task in-progress">
                  <div className="auth-kanban-bar" style={{ width: '85%' }} />
                </div>
                <div className="auth-kanban-task in-progress">
                  <div className="auth-kanban-bar" style={{ width: '60%' }} />
                </div>
              </div>

              {/* Column 3: Completed */}
              <div className="auth-kanban-column">
                <div className="auth-kanban-col-header">
                  <span>Completed</span>
                  <span style={{ fontSize: '11px', color: '#10b981' }}>2</span>
                </div>
                <div className="auth-kanban-task completed">
                  <div className="auth-kanban-bar" style={{ width: '100%' }} />
                </div>
                <div className="auth-kanban-task completed">
                  <div className="auth-kanban-bar" style={{ width: '75%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Footer */}
        <div className="auth-hero-footer">
          <div className="auth-hero-footer-item">
            <Zap size={18} color="#fbbf24" />
            <span>Organize Tasks</span>
          </div>
          <div className="auth-hero-footer-item">
            <Users size={18} color="#60a5fa" />
            <span>Collaborate</span>
          </div>
          <div className="auth-hero-footer-item">
            <BarChart3 size={18} color="#34d399" />
            <span>Track Progress</span>
          </div>
        </div>
      </div>

      {/* Right Login Form Panel (Mobile Friendly & Responsive) */}
      <div className="auth-form-panel">
        <div className="auth-card">
          {/* Top Brand & Header */}
          <div className="auth-card-header">
            <div className="auth-card-logo-wrap">
              <div className="auth-card-logo">
                <Check size={26} strokeWidth={3} />
              </div>
              <span className="auth-card-brand-title">TaskFlow</span>
            </div>
            <h2 className="auth-card-title">Welcome Back</h2>
            <p className="auth-card-subtitle">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="auth-error-alert" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="auth-form" noValidate>
            {/* Email Field */}
            <div className="auth-field">
              <label htmlFor="login-email" className="auth-label">
                Email
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Mail size={18} />
                </span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  className="auth-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="auth-field">
              <div className="auth-label">
                <label htmlFor="login-password">Password</label>
                <a href="#forgot" className="auth-forgot-link">
                  Forgot password?
                </a>
              </div>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="auth-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-toggle-pwd-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="auth-options-row">
              <label className="auth-checkbox-label" htmlFor="remember-me">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="auth-checkbox"
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              style={{ width: '100%', minHeight: '46px', marginTop: '4px' }}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Switcher Pills */}
          <div className="auth-demo-card">
            <div className="auth-demo-label">Quick Demo Access</div>
            <div className="auth-demo-actions">
              <button
                type="button"
                className="auth-demo-btn admin"
                onClick={() => loginAs('admin')}
              >
                <ShieldCheck size={15} />
                <span>Login as Admin</span>
              </button>
              <button
                type="button"
                className="auth-demo-btn user"
                onClick={() => loginAs('user')}
              >
                <UserCheck size={15} />
                <span>Login as User</span>
              </button>
            </div>
          </div>

          {/* Social Divider */}
          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">or</span>
            <div className="auth-divider-line" />
          </div>

          {/* Continue with Google */}
          <button
            type="button"
            onClick={() => handleLogin()}
            className="auth-google-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Footer Navigation */}
          <div className="auth-card-footer">
            Don't have an account?
            <Link to="/register" className="auth-card-footer-link">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
