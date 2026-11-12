import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Building, Phone, Eye, EyeOff, Zap, Users, BarChart3, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const res: any = await api.post('/auth/register', {
        fullName,
        email,
        password,
        department: department.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      if (res?.accessToken && res?.user) {
        setAuth(res.user, res.accessToken, res.refreshToken);
        navigate('/dashboard');
      } else {
        throw new Error('Unexpected response format from server');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check the details provided.');
    } finally {
      setLoading(false);
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

        {/* Hero Content */}
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
            Join the Workflow<br />Empowering Teams
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
            Create your account today and experience seamless project tracking, automated real-time task updates, and unified team collaboration.
          </p>

          {/* Feature Highlights Grid */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              maxWidth: '440px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 18px',
                backgroundColor: 'rgba(255, 255, 255, 0.14)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Zap size={22} color="#fbbf24" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>Real-Time Kanban Sync</div>
                <div style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.8)' }}>
                  Drag, drop, and collaborate with instant live reflection.
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 18px',
                backgroundColor: 'rgba(255, 255, 255, 0.14)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Users size={22} color="#60a5fa" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>Role-Based Access</div>
                <div style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.8)' }}>
                  Granular permission control across projects and tasks.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
            <Zap size={18} />
            <span>Fast Setup</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
            <Users size={18} />
            <span>Team Workspace</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
            <BarChart3 size={18} />
            <span>Instant Insights</span>
          </div>
        </div>
      </div>

      {/* Right Register Form Panel */}
      <div
        style={{
          flex: '1',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Top Logo */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
                marginBottom: '14px',
              }}
            >
              <Check size={28} strokeWidth={3} />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Create an Account
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
              Sign up to get started with TaskFlow
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
                marginBottom: '18px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Full Name */}
            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '5px', display: 'block' }}>
                Full Name
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
                <UserIcon size={18} color="#94a3b8" style={{ marginRight: '10px' }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  required
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    padding: '11px 0',
                    fontSize: '14px',
                    color: '#0f172a',
                  }}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '5px', display: 'block' }}>
                Email Address
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
                  placeholder="name@company.com"
                  required
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    padding: '11px 0',
                    fontSize: '14px',
                    color: '#0f172a',
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '5px', display: 'block' }}>
                Password (min. 8 characters)
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
                <Lock size={18} color="#94a3b8" style={{ marginRight: '10px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    padding: '11px 0',
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

            {/* Department (Optional) */}
            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '5px', display: 'block' }}>
                Department <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
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
                <Building size={18} color="#94a3b8" style={{ marginRight: '10px' }} />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Design, Product, IT"
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    padding: '11px 0',
                    fontSize: '14px',
                    color: '#0f172a',
                  }}
                />
              </div>
            </div>

            {/* Phone (Optional) */}
            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '5px', display: 'block' }}>
                Phone Number <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
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
                <Phone size={18} color="#94a3b8" style={{ marginRight: '10px' }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    padding: '11px 0',
                    fontSize: '14px',
                    color: '#0f172a',
                  }}
                />
              </div>
            </div>

            {/* Sign Up Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              style={{ width: '100%', marginTop: '6px' }}
            >
              Sign Up
            </Button>
          </form>

          {/* Footer Link to Login */}
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13.5px', color: '#64748b' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#4f46e5', fontWeight: 700, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
