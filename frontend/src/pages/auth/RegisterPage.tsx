import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  User as UserIcon,
  Building,
  Phone,
  Eye,
  EyeOff,
  Zap,
  Users,
  BarChart3,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import './auth.css';

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
        setAuth(res.user, res.accessToken, res.refreshToken, res.permissions);
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
    <div className="auth-page">
      {/* Left Gradient Hero Panel (Desktop) */}
      <div className="auth-hero-panel">
        {/* Brand Header */}
        <div className="auth-hero-brand">
          <div className="auth-hero-brand-icon">
            <Check size={24} strokeWidth={3} />
          </div>
          <span className="auth-hero-brand-name">TaskFlow</span>
        </div>

        {/* Hero Content */}
        <div className="auth-hero-body">
          <h1 className="auth-hero-title">
            Join the Workflow<br />Empowering Teams
          </h1>
          <p className="auth-hero-subtitle">
            Create your account today and experience seamless project tracking, automated real-time task updates, and unified team collaboration.
          </p>

          {/* Feature Highlights Grid */}
          <div className="auth-features-list">
            <div className="auth-feature-card">
              <Zap size={22} color="#fbbf24" style={{ flexShrink: 0 }} />
              <div>
                <div className="auth-feature-title">Real-Time Kanban Sync</div>
                <div className="auth-feature-desc">
                  Drag, drop, and collaborate with instant live reflection.
                </div>
              </div>
            </div>

            <div className="auth-feature-card">
              <Users size={22} color="#60a5fa" style={{ flexShrink: 0 }} />
              <div>
                <div className="auth-feature-title">Role-Based Access</div>
                <div className="auth-feature-desc">
                  Granular permission control across projects and tasks.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Footer */}
        <div className="auth-hero-footer">
          <div className="auth-hero-footer-item">
            <Zap size={18} color="#fbbf24" />
            <span>Fast Setup</span>
          </div>
          <div className="auth-hero-footer-item">
            <Users size={18} color="#60a5fa" />
            <span>Team Workspace</span>
          </div>
          <div className="auth-hero-footer-item">
            <BarChart3 size={18} color="#34d399" />
            <span>Instant Insights</span>
          </div>
        </div>
      </div>

      {/* Right Register Form Panel (Mobile Friendly & Responsive) */}
      <div className="auth-form-panel">
        <div className="auth-card register-card">
          {/* Top Logo & Header */}
          <div className="auth-card-header">
            <div className="auth-card-logo-wrap">
              <div className="auth-card-logo">
                <Check size={26} strokeWidth={3} />
              </div>
              <span className="auth-card-brand-title">TaskFlow</span>
            </div>
            <h2 className="auth-card-title">Create an Account</h2>
            <p className="auth-card-subtitle">
              Sign up to get started with TaskFlow
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="auth-error-alert" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="auth-form compact" noValidate>
            {/* Full Name */}
            <div className="auth-field">
              <label htmlFor="reg-name" className="auth-label">
                Full Name
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <UserIcon size={18} />
                </span>
                <input
                  id="reg-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  autoComplete="name"
                  required
                  className="auth-input"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="auth-field">
              <label htmlFor="reg-email" className="auth-label">
                Email Address
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Mail size={18} />
                </span>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                  className="auth-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="auth-field">
              <label htmlFor="reg-password" className="auth-label">
                <span>Password</span>
                <span className="auth-label-optional">(min. 8 characters)</span>
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
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

            {/* Department & Phone Responsive 2-column or stacked */}
            <div className="auth-field-row">
              {/* Department (Optional) */}
              <div className="auth-field">
                <label htmlFor="reg-department" className="auth-label">
                  <span>Department</span>
                  <span className="auth-label-optional">(Optional)</span>
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <Building size={18} />
                  </span>
                  <input
                    id="reg-department"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Design, IT"
                    autoComplete="organization"
                    className="auth-input"
                  />
                </div>
              </div>

              {/* Phone (Optional) */}
              <div className="auth-field">
                <label htmlFor="reg-phone" className="auth-label">
                  <span>Phone Number</span>
                  <span className="auth-label-optional">(Optional)</span>
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <Phone size={18} />
                  </span>
                  <input
                    id="reg-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0199"
                    autoComplete="tel"
                    className="auth-input"
                  />
                </div>
              </div>
            </div>

            {/* Sign Up Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              style={{ width: '100%', minHeight: '46px', marginTop: '6px' }}
            >
              Sign Up
            </Button>
          </form>

          {/* Footer Link to Login */}
          <div className="auth-card-footer">
            Already have an account?
            <Link to="/login" className="auth-card-footer-link">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
