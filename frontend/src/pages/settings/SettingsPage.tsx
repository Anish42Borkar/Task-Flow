import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Info,
  KeyRound,
  Laptop,
  Check,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'about'>('general');

  // General state
  const [appName, setAppName] = useState('TaskFlow');
  const [theme, setTheme] = useState('Light');
  const [timezone, setTimezone] = useState('(GMT+05:30) India Standard Time');
  const [dateFormat, setDateFormat] = useState('DD MMM, YYYY (e.g. 28 Oct, 2026)');

  // Security state
  const [twoFactor, setTwoFactor] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div>
      {/* Page Heading */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SettingsIcon size={16} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>Settings</h1>
        </div>
        <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
          Manage your application preferences and configurations.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('general')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 20px',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: 600,
            backgroundColor: activeTab === 'general' ? '#4f46e5' : '#ffffff',
            color: activeTab === 'general' ? '#ffffff' : '#475569',
            border: activeTab === 'general' ? 'none' : '1px solid #e2e8f0',
            transition: 'all 0.15s ease',
          }}
        >
          <SettingsIcon size={16} />
          General
        </button>

        <button
          onClick={() => setActiveTab('security')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 20px',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: 600,
            backgroundColor: activeTab === 'security' ? '#4f46e5' : '#ffffff',
            color: activeTab === 'security' ? '#ffffff' : '#475569',
            border: activeTab === 'security' ? 'none' : '1px solid #e2e8f0',
            transition: 'all 0.15s ease',
          }}
        >
          <Shield size={16} />
          Security
        </button>

        <button
          onClick={() => setActiveTab('about')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 20px',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: 600,
            backgroundColor: activeTab === 'about' ? '#4f46e5' : '#ffffff',
            color: activeTab === 'about' ? '#ffffff' : '#475569',
            border: activeTab === 'about' ? 'none' : '1px solid #e2e8f0',
            transition: 'all 0.15s ease',
          }}
        >
          <Info size={16} />
          About
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'general' && (
        <Card title="General Settings" subtitle="Configure basic application settings.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '640px', marginTop: '16px' }}>
            <Input
              label="Application Name"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />

            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', backgroundColor: '#ffffff' }}
              >
                <option>Light</option>
                <option>Dark</option>
                <option>System Default</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', backgroundColor: '#ffffff' }}
              >
                <option>(GMT+05:30) India Standard Time</option>
                <option>(GMT+00:00) UTC</option>
                <option>(GMT-05:00) Eastern Time (US & Canada)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Date Format
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', backgroundColor: '#ffffff' }}
              >
                <option>DD MMM, YYYY (e.g. 28 Oct, 2026)</option>
                <option>YYYY-MM-DD</option>
                <option>MM/DD/YYYY</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button variant="outline">Cancel</Button>
              <Button variant="primary" onClick={handleSave}>
                {isSaved ? 'Saved!' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card title="Security Settings" subtitle="Manage your account security and access controls.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <KeyRound size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Change Password</div>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>Update your account password periodically.</div>
                </div>
              </div>
              <Button variant="outline" size="sm">Change Password</Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Laptop size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Session Management</div>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>View and revoke active sessions on other devices.</div>
                </div>
              </div>
              <Button variant="outline" size="sm">Manage Sessions</Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Two-Factor Authentication (2FA)</div>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>Add an extra layer of security to your account.</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={(e) => setTwoFactor(e.target.checked)}
                style={{ accentColor: '#4f46e5', width: '20px', height: '20px' }}
              />
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'about' && (
        <Card title="About TaskFlow" subtitle="Application information and version details.">
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', marginTop: '20px', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#4f46e5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={28} strokeWidth={3} />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>TaskFlow</h3>
                  <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>Version 1.0.0</div>
                </div>
              </div>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                A simple and efficient task management application to plan, track, and collaborate on your work with real-time updates and persistent task ordering.
              </p>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                <span style={{ color: '#64748b' }}>Build Version</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>v1.0.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                <span style={{ color: '#64748b' }}>Last Updated</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>08 Nov 2026</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                <span style={{ color: '#64748b' }}>License</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>MIT</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
