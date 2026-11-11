import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Shield,
  Search,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { User, RoleType } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useNotificationStore } from '../../stores/notificationStore';
import { api } from '../../services/api';

export const UserManagementPage: React.FC = () => {
  const { addToast } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New User form
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Password123!');
  const [newRoleId, setNewRoleId] = useState('user');
  const [newDept, setNewDept] = useState('Engineering');
  const [newPhone, setNewPhone] = useState('');

  // New Role form
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usersRes, rolesRes]: [any, any] = await Promise.all([
        api.get('/users?limit=50'),
        api.get('/roles'),
      ]);

      const rawUsers = usersRes?.data || usersRes?.users || (Array.isArray(usersRes) ? usersRes : []);
      const userList = rawUsers.map((u: any) => ({
        ...u,
        role: u.role || u.roleId || 'user',
      }));
      const roleList = Array.isArray(rolesRes) ? rolesRes : [];

      setUsers(userList);
      setRoles(roleList);
      if (roleList.length > 0 && !newRoleId) {
        setNewRoleId(roleList[0].id);
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to fetch users and roles', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, newRoleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = users.filter((u) => {
    const fullName = (u.fullName || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase());
    const userRole = (u.role || (u as any).roleId || '').toLowerCase();
    const matchesRole = roleFilter === 'all' || userRole === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim() || !newPassword.trim()) return;

    try {
      setIsSubmitting(true);
      await api.post('/users', {
        fullName: newFullName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        roleId: newRoleId,
        department: newDept.trim() || undefined,
        phone: newPhone.trim() || undefined,
      });

      addToast('User Created', `User "${newFullName}" successfully registered`, 'success');
      setIsAddUserModalOpen(false);
      setNewFullName('');
      setNewEmail('');
      fetchData();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to create user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete user "${name}"?`)) {
      try {
        await api.delete(`/users/${id}`);
        setUsers((prev) => prev.filter((u) => u.id !== id));
        addToast('User Removed', `User "${name}" has been deleted`, 'info');
      } catch (err: any) {
        addToast('Error', err.message || 'Failed to delete user', 'error');
      }
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    try {
      setIsSubmitting(true);
      await api.post('/roles', {
        name: newRoleName.trim(),
        description: newRoleDesc.trim() || undefined,
      });

      addToast('Role Created', `Role "${newRoleName}" added`, 'success');
      setIsAddRoleModalOpen(false);
      setNewRoleName('');
      setNewRoleDesc('');
      fetchData();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to create role', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>User Management</h1>
          </div>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
            Manage user accounts, roles, access permissions and directory status.
          </p>
        </div>
      </div>

      {/* Main Container Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Navigation Tabs (Users / Roles) */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 24px', backgroundColor: '#f8fafc' }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '16px 20px',
              fontSize: '14px',
              fontWeight: 700,
              color: activeTab === 'users' ? '#4f46e5' : '#64748b',
              borderBottom: activeTab === 'users' ? '2px solid #4f46e5' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
            }}
          >
            <Users size={16} />
            Users Directory ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            style={{
              padding: '16px 20px',
              fontSize: '14px',
              fontWeight: 700,
              color: activeTab === 'roles' ? '#4f46e5' : '#64748b',
              borderBottom: activeTab === 'roles' ? '2px solid #4f46e5' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
            }}
          >
            <Shield size={16} />
            Roles & System Groups ({roles.length})
          </button>
        </div>

        {activeTab === 'users' ? (
          <div>
            {/* Filter Bar */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    width: '260px',
                  }}
                >
                  <Search size={16} color="#94a3b8" style={{ marginRight: '8px' }} />
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ border: 'none', outline: 'none', fontSize: '13.5px', width: '100%', color: '#0f172a' }}
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    fontSize: '13.5px',
                    color: '#334155',
                    outline: 'none',
                  }}
                >
                  <option value="all">All Roles</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setIsAddUserModalOpen(true)}
              >
                Add User
              </Button>
            </div>

            {/* Users Table */}
            <div style={{ overflowX: 'auto' }}>
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#64748b', gap: '10px' }}>
                  <Loader2 size={24} className="spin-animate" />
                  <span>Loading users...</span>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: '12.5px' }}>
                      <th style={{ padding: '14px 20px' }}>Name</th>
                      <th style={{ padding: '14px 20px' }}>Email</th>
                      <th style={{ padding: '14px 20px' }}>Role</th>
                      <th style={{ padding: '14px 20px' }}>Department</th>
                      <th style={{ padding: '14px 20px' }}>Status</th>
                      <th style={{ padding: '14px 20px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const roleName = (u.role || (u as any).roleId || 'user').toUpperCase();
                      const initials = u.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();

                      return (
                        <tr
                          key={u.id}
                          style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '50%',
                                  backgroundColor: '#4f46e5',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {initials}
                              </div>
                              <span style={{ fontWeight: 700, color: '#0f172a' }}>{u.fullName}</span>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', color: '#475569' }}>{u.email}</td>
                          <td style={{ padding: '16px 20px' }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                backgroundColor: roleName === 'ADMIN' ? '#eef2ff' : '#f1f5f9',
                                color: roleName === 'ADMIN' ? '#4f46e5' : '#475569',
                              }}
                            >
                              {roleName}
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px', color: '#64748b' }}>{u.department || 'General'}</td>
                          <td style={{ padding: '16px 20px' }}>
                            <Badge variant={u.isActive ? 'completed' : 'pending'}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.fullName)}
                              style={{ color: '#ef4444', padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          /* Roles Tab */
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Configured Roles</div>
              <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsAddRoleModalOpen(true)}>
                Add Role
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {roles.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={16} />
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{r.name}</span>
                    </div>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: '#f1f5f9', fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>
                      ID: {r.id}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', minHeight: '38px', lineHeight: 1.4 }}>
                    {r.description || 'System access role for workspace permission governance.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add User */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Add New User"
        subtitle="Create an account and assign workspace role."
      >
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Full Name"
            required
            placeholder="e.g. Priya Sharma"
            value={newFullName}
            onChange={(e) => setNewFullName(e.target.value)}
          />

          <Input
            label="Email Address"
            required
            type="email"
            placeholder="e.g. priya.sharma@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />

          <Input
            label="Initial Password"
            required
            type="password"
            placeholder="Enter temporary password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Role *
              </label>
              <select
                value={newRoleId}
                onChange={(e) => setNewRoleId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                  outline: 'none',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                }}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Department"
              placeholder="e.g. IT, Engineering"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsAddUserModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Role */}
      <Modal
        isOpen={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        title="Add New Role"
        subtitle="Define a custom system role."
      >
        <form onSubmit={handleCreateRole} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Role Name"
            required
            placeholder="e.g. Auditor, QA Specialist"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
          />

          <div>
            <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
              Description
            </label>
            <textarea
              placeholder="Scope and purpose of this role..."
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                outline: 'none',
                fontSize: '13.5px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsAddRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Role
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
