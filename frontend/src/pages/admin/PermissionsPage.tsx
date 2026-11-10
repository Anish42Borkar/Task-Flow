import React, { useState } from 'react';
import {
  ShieldCheck,
  Folder,
  CheckSquare,
  Users,
  Settings as SettingsIcon,
  Bell,
  Save,
  Check,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

interface PermissionRow {
  module: string;
  name: string;
  icon: React.ReactNode;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const DEFAULT_PERMISSIONS: Record<string, PermissionRow[]> = {
  admin: [
    { module: 'projects', name: 'Projects', icon: <Folder size={18} color="#4f46e5" />, canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'tasks', name: 'Tasks', icon: <CheckSquare size={18} color="#4f46e5" />, canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'users', name: 'User Management', icon: <Users size={18} color="#4f46e5" />, canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'permissions', name: 'Permissions', icon: <ShieldCheck size={18} color="#4f46e5" />, canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'notifications', name: 'Notifications', icon: <Bell size={18} color="#4f46e5" />, canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'settings', name: 'Settings', icon: <SettingsIcon size={18} color="#4f46e5" />, canView: true, canCreate: false, canEdit: false, canDelete: false },
  ],
  project_manager: [
    { module: 'projects', name: 'Projects', icon: <Folder size={18} color="#4f46e5" />, canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'tasks', name: 'Tasks', icon: <CheckSquare size={18} color="#4f46e5" />, canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'users', name: 'User Management', icon: <Users size={18} color="#4f46e5" />, canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'permissions', name: 'Permissions', icon: <ShieldCheck size={18} color="#4f46e5" />, canView: true, canCreate: false, canEdit: true, canDelete: false },
    { module: 'notifications', name: 'Notifications', icon: <Bell size={18} color="#4f46e5" />, canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'settings', name: 'Settings', icon: <SettingsIcon size={18} color="#4f46e5" />, canView: true, canCreate: false, canEdit: true, canDelete: false },
  ],
  user: [
    { module: 'projects', name: 'Projects', icon: <Folder size={18} color="#4f46e5" />, canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'tasks', name: 'Tasks', icon: <CheckSquare size={18} color="#4f46e5" />, canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'users', name: 'User Management', icon: <Users size={18} color="#4f46e5" />, canView: false, canCreate: false, canEdit: false, canDelete: false },
    { module: 'permissions', name: 'Permissions', icon: <ShieldCheck size={18} color="#4f46e5" />, canView: false, canCreate: false, canEdit: false, canDelete: false },
    { module: 'notifications', name: 'Notifications', icon: <Bell size={18} color="#4f46e5" />, canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'settings', name: 'Settings', icon: <SettingsIcon size={18} color="#4f46e5" />, canView: false, canCreate: false, canEdit: false, canDelete: false },
  ],
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Full access to all modules and configurations across the entire organization.',
  project_manager: 'Can create and manage projects, tasks, and team members.',
  user: 'Access to assigned projects and tasks with workflow reordering.',
};

export const PermissionsPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('project_manager');
  const [permissions, setPermissions] = useState<Record<string, PermissionRow[]>>(DEFAULT_PERMISSIONS);
  const [isSaved, setIsSaved] = useState(false);

  const currentRows = permissions[selectedRole] || [];

  const handleToggle = (moduleKey: string, field: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    setPermissions((prev) => ({
      ...prev,
      [selectedRole]: prev[selectedRole].map((row) =>
        row.module === moduleKey ? { ...row, [field]: !row[field] } : row
      ),
    }));
    setIsSaved(false);
  };

  const handleMasterToggle = (field: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    const allChecked = currentRows.every((r) => r[field]);
    setPermissions((prev) => ({
      ...prev,
      [selectedRole]: prev[selectedRole].map((row) => ({ ...row, [field]: !allChecked })),
    }));
    setIsSaved(false);
  };

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
            <ShieldCheck size={16} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>Permissions</h1>
        </div>
        <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
          Define and manage what each role can access and do in the application.
        </p>
      </div>

      {/* Main Permissions Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          padding: '28px',
        }}
      >
        {/* Role Selector & Description Box */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '28px' }}>
          <div>
            <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
              Role *
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                outline: 'none',
                fontSize: '14px',
                backgroundColor: '#ffffff',
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              <option value="admin">Admin</option>
              <option value="project_manager">Project Manager</option>
              <option value="user">User / Member</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
              Description
            </label>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '13.5px',
                color: '#475569',
              }}
            >
              {ROLE_DESCRIPTIONS[selectedRole]}
            </div>
          </div>
        </div>

        {/* Permissions Table Matrix */}
        <div style={{ overflowX: 'auto', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#0f172a', fontWeight: 700 }}>
                <th style={{ padding: '16px 20px', width: '35%' }}>Module / Feature</th>
                <th style={{ padding: '16px 20px', textAlign: 'center' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={currentRows.length > 0 && currentRows.every((r) => r.canView)}
                      onChange={() => handleMasterToggle('canView')}
                      style={{ accentColor: '#4f46e5', width: '16px', height: '16px', borderRadius: '4px' }}
                    />
                    View
                  </label>
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'center' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={currentRows.length > 0 && currentRows.every((r) => r.canCreate)}
                      onChange={() => handleMasterToggle('canCreate')}
                      style={{ accentColor: '#4f46e5', width: '16px', height: '16px', borderRadius: '4px' }}
                    />
                    Create
                  </label>
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'center' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={currentRows.length > 0 && currentRows.every((r) => r.canEdit)}
                      onChange={() => handleMasterToggle('canEdit')}
                      style={{ accentColor: '#4f46e5', width: '16px', height: '16px', borderRadius: '4px' }}
                    />
                    Edit
                  </label>
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'center' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={currentRows.length > 0 && currentRows.every((r) => r.canDelete)}
                      onChange={() => handleMasterToggle('canDelete')}
                      style={{ accentColor: '#4f46e5', width: '16px', height: '16px', borderRadius: '4px' }}
                    />
                    Delete
                  </label>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row) => (
                <tr key={row.module} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {row.icon}
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={row.canView}
                      onChange={() => handleToggle(row.module, 'canView')}
                      style={{ accentColor: '#4f46e5', width: '18px', height: '18px', borderRadius: '4px', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={row.canCreate}
                      onChange={() => handleToggle(row.module, 'canCreate')}
                      style={{ accentColor: '#4f46e5', width: '18px', height: '18px', borderRadius: '4px', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={row.canEdit}
                      onChange={() => handleToggle(row.module, 'canEdit')}
                      style={{ accentColor: '#4f46e5', width: '18px', height: '18px', borderRadius: '4px', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={row.canDelete}
                      onChange={() => handleToggle(row.module, 'canDelete')}
                      style={{ accentColor: '#4f46e5', width: '18px', height: '18px', borderRadius: '4px', cursor: 'pointer' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <Button variant="outline">Cancel</Button>
          <Button variant="primary" icon={<Save size={16} />} onClick={handleSave}>
            {isSaved ? 'Saved!' : 'Save Permissions'}
          </Button>
        </div>
      </div>
    </div>
  );
};
