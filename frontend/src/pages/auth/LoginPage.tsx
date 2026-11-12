import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Zap, Users, BarChart3, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';

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
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Left Gradient Hero Panel */}
      <div
        style={{
          flex: '1.1',
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)',
          color: '#ffffff',
          padding: '60px 70px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4f46e5',
            }}
          >
            <Check size={24} strokeWidth={3} />
          </div>
          <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px' }}>
            TaskFlow
          </span>
        </div>

        {/* Hero Content & Kanban Illustration Graphic */}
        <div style={{ margin: '40px 0' }}>
          <h1
            style={{
              fontSize: '44px',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.5px',
              marginBottom: '16px',
            }}
          >
            Manage Projects,<br />Tasks and Teams
          </h1>
          <p
            style={{
              fontSize: '17px',
              color: 'rgba(255, 255, 255, 0.85)',
              maxWidth: '440px',
              lineHeight: 1.5,
              marginBottom: '40px',
            }}
          >
            A simple and collaborative task management platform for your team.
          </p>

          {/* Kanban Board Graphic Card */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(16px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '24px',
              maxWidth: '480px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {/* Column 1: Pending */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  borderRadius: '10px',
                  padding: '12px',
                  color: '#1e293b',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>Pending</div>
                <div
                  style={{
                    height: '24px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '6px',
                    marginBottom: '6px',
                    borderLeft: '3px solid #f59e0b',
                  }}
                />
                <div
                  style={{
                    height: '24px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '6px',
                    borderLeft: '3px solid #f59e0b',
                  }}
                />
              </div>

              {/* Column 2: In Progress */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  borderRadius: '10px',
                  padding: '12px',
                  color: '#1e293b',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>In Progress</div>
                <div
                  style={{
                    height: '24px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '6px',
                    marginBottom: '6px',
                    borderLeft: '3px solid #3b82f6',
                  }}
                />
                <div
                  style={{
                    height: '24px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '6px',
                    borderLeft: '3px solid #3b82f6',
                  }}
                />
              </div>

              {/* Column 3: Completed */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  borderRadius: '10px',
                  padding: '12px',
                  color: '#1e293b',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>Completed</div>
                <div
                  style={{
                    height: '24px',
                    backgroundColor: '#ecfdf5',
                    borderRadius: '6px',
                    marginBottom: '6px',
                    borderLeft: '3px solid #10b981',
                  }}
                />
                <div
                  style={{
                    height: '24px',
                    backgroundColor: '#ecfdf5',
                    borderRadius: '6px',
                    borderLeft: '3px solid #10b981',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
            <Zap size={18} />
            <span>Organize Tasks</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
            <Users size={18} />
            <span>Collaborate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
            <BarChart3 size={18} />
            <span>Track Progress</span>
          </div>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div
        style={{
          flex: '1',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Top Logo */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Check size={28} strokeWidth={3} />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
              Sign in to your account to continue
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                color: '#dc2626',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Email Field */}
            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Email
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0 14px',
                  backgroundColor: '#ffffff',
                }}
              >
                <Mail size={18} color="#94a3b8" style={{ marginRight: '10px' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    padding: '12px 0',
                    fontSize: '14px',
                    color: '#0f172a',
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b' }}>
                  Password
                </label>
                <a href="#forgot" style={{ fontSize: '12.5px', fontWeight: 600, color: '#4f46e5' }}>
                  Forgot password?
                </a>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0 14px',
                  backgroundColor: '#ffffff',
                }}
              >
                <Lock size={18} color="#94a3b8" style={{ marginRight: '10px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    padding: '12px 0',
                    fontSize: '14px',
                    color: '#0f172a',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#4f46e5', borderRadius: '4px' }}
              />
              <label htmlFor="remember" style={{ fontSize: '13.5px', color: '#475569', cursor: 'pointer' }}>
                Remember me
              </label>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              style={{ width: '100%', marginTop: '6px' }}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Switcher Pills */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>
              Quick Demo Access
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <Button size="sm" variant="secondary" onClick={() => loginAs('admin')}>
                Login as Admin
              </Button>
              <Button size="sm" variant="outline" onClick={() => loginAs('user')}>
                Login as User
              </Button>
            </div>
          </div>

          {/* Google Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '22px 0',
              color: '#94a3b8',
              fontSize: '13px',
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            <span style={{ padding: '0 14px' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          </div>

          {/* Continue with Google */}
          <button
            onClick={() => handleLogin()}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '11px',
              borderRadius: '10px',
              border: '1.5px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              color: '#334155',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
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
            Continue with Google
          </button>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '13px', color: '#64748b' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#4f46e5', fontWeight: 700, textDecoration: 'none' }}>
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
