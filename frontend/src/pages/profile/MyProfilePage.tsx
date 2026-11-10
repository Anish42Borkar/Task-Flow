import React, { useState } from 'react';
import {
  User as UserIcon,
  KeyRound,
  Camera,
  Calendar,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const MyProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile Form state
  const [fullName, setFullName] = useState(user?.fullName || 'Anish Borkar');
  const [email, setEmail] = useState(user?.email || 'anish.borkar@example.com');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [department, setDepartment] = useState(user?.department || 'IT');

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      setUser({ ...user, fullName, email, phone, department });
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber) {
      alert('Please satisfy all password complexity rules.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    setSuccessMessage('Password changed successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div>
      {/* Top Heading */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>My Profile</h1>
        <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
          View and update your personal information and security.
        </p>
      </div>

      {/* Profile Header Avatar Banner */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <button
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#4f46e5',
              border: '2px solid #ffffff',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Upload photo"
          >
            <Camera size={14} />
          </button>
        </div>

        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{fullName}</h2>
          <div style={{ fontSize: '13.5px', color: '#64748b', textTransform: 'capitalize', marginTop: '2px' }}>
            {user?.role || 'Admin'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 20px',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: 600,
            backgroundColor: activeTab === 'profile' ? '#4f46e5' : '#ffffff',
            color: activeTab === 'profile' ? '#ffffff' : '#475569',
            border: activeTab === 'profile' ? 'none' : '1px solid #e2e8f0',
          }}
        >
          <UserIcon size={16} />
          Profile
        </button>

        <button
          onClick={() => setActiveTab('password')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 20px',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: 600,
            backgroundColor: activeTab === 'password' ? '#4f46e5' : '#ffffff',
            color: activeTab === 'password' ? '#ffffff' : '#475569',
            border: activeTab === 'password' ? 'none' : '1px solid #e2e8f0',
          }}
        >
          <KeyRound size={16} />
          Change Password
        </button>
      </div>

      {successMessage && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '10px',
            color: '#059669',
            fontSize: '13.5px',
            fontWeight: 600,
            marginBottom: '20px',
          }}
        >
          {successMessage}
        </div>
      )}

      {activeTab === 'profile' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Left: Personal Information */}
          <Card title="Personal Information">
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '16px' }}>
              <Input
                label="Full Name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input
                  label="Email"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  label="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                    Role
                  </label>
                  <input
                    disabled
                    value={user?.role === 'admin' ? 'Admin' : 'User'}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      color: '#64748b',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', backgroundColor: '#ffffff' }}
                  >
                    <option>IT</option>
                    <option>Delivery</option>
                    <option>Design</option>
                    <option>QA</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <Button type="button" variant="outline">Cancel</Button>
                <Button type="submit" variant="primary">Save Changes</Button>
              </div>
            </form>
          </Card>

          {/* Right: Account Details Card */}
          <Card title="Account Details">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Calendar size={18} color="#4f46e5" />
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Joined On</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>01 Nov 2026</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={18} color="#4f46e5" />
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Last Login</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>08 Nov 2026, 02:45 PM</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldCheck size={18} color="#059669" />
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Account Status</div>
                  <Badge variant="active" dot>Active</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        /* Change Password Tab */
        <Card title="Change Password" subtitle="Update your password to keep your account secure.">
          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '540px', marginTop: '16px' }}>
            <Input
              label="Current Password"
              required
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <Input
              label="New Password"
              required
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            {/* Validation checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasMinLength ? '#059669' : '#64748b' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: hasMinLength ? '#059669' : '#cbd5e1' }} />
                At least 8 characters
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasUppercase ? '#059669' : '#64748b' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: hasUppercase ? '#059669' : '#cbd5e1' }} />
                Includes an uppercase letter (A-Z)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasLowercase ? '#059669' : '#64748b' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: hasLowercase ? '#059669' : '#cbd5e1' }} />
                Includes a lowercase letter (a-z)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasNumber ? '#059669' : '#64748b' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: hasNumber ? '#059669' : '#cbd5e1' }} />
                Includes a number (0-9)
              </div>
            </div>

            <Input
              label="Confirm New Password"
              required
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
              <Button type="button" variant="outline">Cancel</Button>
              <Button type="submit" variant="primary">Update Password</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};
