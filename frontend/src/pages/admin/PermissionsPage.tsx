import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Folder,
  CheckSquare,
  Users,
  Settings as SettingsIcon,
  Bell,
  Save,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useNotificationStore } from '../../stores/notificationStore';
import { api } from '../../services/api';

interface PermissionRow {
  module: string;
  name: string;
  icon: React.ReactNode;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const MODULE_ICONS: Record<string, React.ReactNode> = {
  projects: <Folder size={18} color="#4f46e5" />,
  tasks: <CheckSquare size={18} color="#4f46e5" />,
  users: <Users size={18} color="#4f46e5" />,
  permissions: <ShieldCheck size={18} color="#4f46e5" />,
  notifications: <Bell size={18} color="#4f46e5" />,
  settings: <SettingsIcon size={18} color="#4f46e5" />,
};

const MODULE_NAMES: Record<string, string> = {
  projects: 'Projects',
  tasks: 'Tasks',
  users: 'User Management',
  permissions: 'Permissions',
  notifications: 'Notifications',
  settings: 'Settings',
};

export const PermissionsPage: React.FC = () => {
  const { addToast } = useNotificationStore();
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('project_manager');
  const [matrix, setMatrix] = useState<PermissionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRoles = useCallback(async () => {
    try {
      const data: any = await api.get('/roles');
      const list = Array.isArray(data) ? data : [];
      setRoles(list);
      if (list.length > 0 && !selectedRoleId) {
        setSelectedRoleId(list[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load roles:', err);
    }
  }, [selectedRoleId]);

  const fetchPermissions = useCallback(async () => {
    if (!selectedRoleId) return;
    try {
      setIsLoading(true);
      const data: any = await api.get(`/permissions/${selectedRoleId}`);
      const permList = Array.isArray(data) ? data : data?.permissions || [];

      const rows: PermissionRow[] = permList.map((p: any) => ({
        module: p.module,
        name: MODULE_NAMES[p.module] || p.module,
        icon: MODULE_ICONS[p.module] || <ShieldCheck size={18} color="#4f46e5" />,
        canView: !!p.canView,
        canCreate: !!p.canCreate,
        canEdit: !!p.canEdit,
        canDelete: !!p.canDelete,
      }));

      setMatrix(rows);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to load permissions matrix', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedRoleId, addToast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleToggle = (moduleKey: string, field: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    setMatrix((prev) =>
      prev.map((row) => (row.module === moduleKey ? { ...row, [field]: !row[field] } : row)),
    );
  };

  const handleMasterToggle = (field: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    const allChecked = matrix.every((r) => r[field]);
    setMatrix((prev) => prev.map((row) => ({ ...row, [field]: !allChecked })));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = matrix.map((m) => ({
        module: m.module,
        canView: m.canView,
        canCreate: m.canCreate,
        canEdit: m.canEdit,
        canDelete: m.canDelete,
      }));

      await api.put(`/permissions/${selectedRoleId}`, { permissions: payload });
      addToast('Permissions Saved', `Role permissions updated successfully`, 'success');
    } catch (err: any) {
      addToast('Save Failed', err.message || 'Could not update permissions', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

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
          Define granular access and capabilities for each role in the application.
        </p>
      </div>

      {/* Role Selector Pills */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px 24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
          Select Role to Configure
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {roles.map((r) => {
            const isSelected = r.id === selectedRoleId;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoleId(r.id)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  backgroundColor: isSelected ? '#4f46e5' : '#f8fafc',
                  color: isSelected ? '#ffffff' : '#334155',
                  border: isSelected ? 'none' : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 4px 6px -1px rgba(79, 70, 229, 0.25)' : 'none',
                }}
              >
                {r.name}
              </button>
            );
          })}
        </div>
        {selectedRole && (
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '14px', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
            ℹ️ {selectedRole.description || `Configuring capabilities for ${selectedRole.name}`}
          </p>
        )}
      </div>

      {/* Permissions Matrix Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Granular Access Control Matrix</h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
              Check to grant permissions for {selectedRole?.name || 'this role'}
            </p>
          </div>

          <Button
            variant="primary"
            icon={<Save size={16} />}
            onClick={handleSave}
            isLoading={isSaving}
          >
            Save Permissions
          </Button>
        </div>

        {/* Matrix Table */}
        <div style={{ overflowX: 'auto' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#64748b', gap: '10px' }}>
              <Loader2 size={24} className="spin-animate" />
              <span>Loading matrix...</span>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: '12.5px' }}>
                  <th style={{ padding: '14px 24px', width: '30%' }}>Module / Feature</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', width: '17%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span>View</span>
                      <input
                        type="checkbox"
                        checked={matrix.length > 0 && matrix.every((r) => r.canView)}
                        onChange={() => handleMasterToggle('canView')}
                        style={{ accentColor: '#4f46e5', cursor: 'pointer' }}
                        title="Toggle all View"
                      />
                    </div>
                  </th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', width: '17%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span>Create</span>
                      <input
                        type="checkbox"
                        checked={matrix.length > 0 && matrix.every((r) => r.canCreate)}
                        onChange={() => handleMasterToggle('canCreate')}
                        style={{ accentColor: '#4f46e5', cursor: 'pointer' }}
                        title="Toggle all Create"
                      />
                    </div>
                  </th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', width: '17%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span>Edit</span>
                      <input
                        type="checkbox"
                        checked={matrix.length > 0 && matrix.every((r) => r.canEdit)}
                        onChange={() => handleMasterToggle('canEdit')}
                        style={{ accentColor: '#4f46e5', cursor: 'pointer' }}
                        title="Toggle all Edit"
                      />
                    </div>
                  </th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', width: '17%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span>Delete</span>
                      <input
                        type="checkbox"
                        checked={matrix.length > 0 && matrix.every((r) => r.canDelete)}
                        onChange={() => handleMasterToggle('canDelete')}
                        style={{ accentColor: '#4f46e5', cursor: 'pointer' }}
                        title="Toggle all Delete"
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => (
                  <tr
                    key={row.module}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {row.icon}
                        </div>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</span>
                      </div>
                    </td>

                    {/* View Checkbox */}
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={row.canView}
                        onChange={() => handleToggle(row.module, 'canView')}
                        style={{ width: '17px', height: '17px', accentColor: '#4f46e5', cursor: 'pointer' }}
                      />
                    </td>

                    {/* Create Checkbox */}
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={row.canCreate}
                        onChange={() => handleToggle(row.module, 'canCreate')}
                        style={{ width: '17px', height: '17px', accentColor: '#4f46e5', cursor: 'pointer' }}
                      />
                    </td>

                    {/* Edit Checkbox */}
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={row.canEdit}
                        onChange={() => handleToggle(row.module, 'canEdit')}
                        style={{ width: '17px', height: '17px', accentColor: '#4f46e5', cursor: 'pointer' }}
                      />
                    </td>

                    {/* Delete Checkbox */}
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={row.canDelete}
                        onChange={() => handleToggle(row.module, 'canDelete')}
                        style={{ width: '17px', height: '17px', accentColor: '#4f46e5', cursor: 'pointer' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
