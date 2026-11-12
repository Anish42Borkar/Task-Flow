import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Shield,
  Search,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
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
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isDeleteRoleModalOpen, setIsDeleteRoleModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New User form
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Password123!');
  const [newRoleId, setNewRoleId] = useState('user');
  const [newDept, setNewDept] = useState('Engineering');
  const [newPhone, setNewPhone] = useState('');

  // Edit User form
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRoleId, setEditRoleId] = useState('user');
  const [editDept, setEditDept] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // New Role form
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // Edit Role form
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDesc, setEditRoleDesc] = useState('');

  // Delete Role state
  const [roleToDelete, setRoleToDelete] = useState<any | null>(null);
  const [reassignTargetRoleId, setReassignTargetRoleId] = useState('user');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usersRes, rolesRes]: [any, any] = await Promise.all([
        api.get('/users?limit=100'),
        api.get('/roles'),
      ]);

      const rawUsers = usersRes?.data || usersRes?.users || (Array.isArray(usersRes) ? usersRes : []);
      const userList = rawUsers.map((u: any) => ({
        ...u,
        role: u.role || u.roleId || 'user',
        roleId: u.roleId || u.role || 'user',
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

  // ============================================================================
  // USER ACTIONS
  // ============================================================================

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
      setNewPhone('');
      fetchData();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to create user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditUserModal = (u: User) => {
    setEditingUser(u);
    setEditFullName(u.fullName || '');
    setEditEmail(u.email || '');
    setEditRoleId((u as any).roleId || u.role || 'user');
    setEditDept(u.department || '');
    setEditPhone(u.phone || '');
    setEditIsActive(u.isActive !== false);
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editFullName.trim() || !editEmail.trim()) return;

    try {
      setIsSubmitting(true);
      await api.put(`/users/${editingUser.id}`, {
        fullName: editFullName.trim(),
        email: editEmail.trim(),
        roleId: editRoleId,
        department: editDept.trim() || undefined,
        phone: editPhone.trim() || undefined,
        isActive: editIsActive,
      });

      addToast('User Updated', `Account for "${editFullName}" updated successfully`, 'success');
      setIsEditUserModalOpen(false);
      fetchData();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick 1-Click Role Change directly in the table
  const handleQuickRoleChange = async (userId: string, newRole: string) => {
    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole as RoleType, roleId: newRole } : u)),
    );

    try {
      await api.put(`/users/${userId}`, { roleId: newRole });
      const targetRoleName = roles.find((r) => r.id === newRole)?.name || newRole;
      addToast('Role Updated', `User role changed to "${targetRoleName}"`, 'success');
      fetchData();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update user role', 'error');
      fetchData(); // Rollback on error
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

  // ============================================================================
  // ROLE ACTIONS
  // ============================================================================

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    try {
      setIsSubmitting(true);
      await api.post('/roles', {
        name: newRoleName.trim(),
        description: newRoleDesc.trim() || undefined,
      });

      addToast('Role Created', `Role "${newRoleName}" added successfully`, 'success');
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

  const openEditRoleModal = (role: any) => {
    setEditingRole(role);
    setEditRoleName(role.name || '');
    setEditRoleDesc(role.description || '');
    setIsEditRoleModalOpen(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole || !editRoleName.trim()) return;

    try {
      setIsSubmitting(true);
      await api.put(`/roles/${editingRole.id}`, {
        name: editRoleName.trim(),
        description: editRoleDesc.trim() || undefined,
      });

      addToast('Role Updated', `Role "${editRoleName}" updated successfully`, 'success');
      setIsEditRoleModalOpen(false);
      fetchData();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update role', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteRoleModal = (role: any) => {
    if (role.id === 'admin') {
      addToast('Action Denied', 'The Administrator role is essential and cannot be deleted.', 'error');
      return;
    }
    setRoleToDelete(role);
    // Default reassignment role to 'user' if not the same
    setReassignTargetRoleId(role.id === 'user' ? 'viewer' : 'user');
    setIsDeleteRoleModalOpen(true);
  };

  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      setIsSubmitting(true);
      const userCount = roleToDelete.usersCount || 0;
      let url = `/roles/${roleToDelete.id}`;
      if (userCount > 0 && reassignTargetRoleId) {
        url += `?reassignTo=${reassignTargetRoleId}`;
      }

      await api.delete(url);
      addToast(
        'Role Deleted',
        `Role "${roleToDelete.name}" was deleted${
          userCount > 0 ? ` and ${userCount} user(s) reassigned to "${reassignTargetRoleId}"` : ''
        }`,
        'success',
      );
      setIsDeleteRoleModalOpen(false);
      setRoleToDelete(null);
      fetchData();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to delete role', 'error');
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
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: '#eef2ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={16} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>User Management</h1>
          </div>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
            Manage user accounts, assign roles, define custom system groups, and configure permissions.
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
                    cursor: 'pointer',
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
                  <Loader2 size={24} className="animate-spin" />
                  <span>Loading users...</span>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: '12.5px' }}>
                      <th style={{ padding: '14px 20px' }}>Name</th>
                      <th style={{ padding: '14px 20px' }}>Email</th>
                      <th style={{ padding: '14px 20px', minWidth: '180px' }}>Role</th>
                      <th style={{ padding: '14px 20px' }}>Department</th>
                      <th style={{ padding: '14px 20px' }}>Status</th>
                      <th style={{ padding: '14px 20px', textAlign: 'center', width: '110px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const userRoleId = (u as any).roleId || u.role || 'user';
                      const initials = (u.fullName || 'User')
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

                          {/* Quick Role Change Column */}
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <select
                                value={userRoleId}
                                onChange={(e) => handleQuickRoleChange(u.id, e.target.value)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  border: '1.5px solid #e2e8f0',
                                  backgroundColor:
                                    userRoleId === 'admin'
                                      ? '#eef2ff'
                                      : userRoleId === 'project_manager'
                                      ? '#eff6ff'
                                      : userRoleId === 'viewer'
                                      ? '#f8fafc'
                                      : '#f0fdf4',
                                  color:
                                    userRoleId === 'admin'
                                      ? '#4f46e5'
                                      : userRoleId === 'project_manager'
                                      ? '#2563eb'
                                      : userRoleId === 'viewer'
                                      ? '#64748b'
                                      : '#16a34a',
                                  cursor: 'pointer',
                                  outline: 'none',
                                }}
                                title="Click to quickly reassign role"
                              >
                                {roles.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          <td style={{ padding: '16px 20px', color: '#64748b' }}>{u.department || 'General'}</td>
                          <td style={{ padding: '16px 20px' }}>
                            <Badge variant={u.isActive ? 'completed' : 'pending'}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>

                          {/* Action Buttons: Edit User & Delete User */}
                          <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              <button
                                onClick={() => openEditUserModal(u)}
                                style={{
                                  color: '#64748b',
                                  padding: '6px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                }}
                                title="Edit User Account & Role"
                              >
                                <Edit2 size={16} />
                              </button>

                              <button
                                onClick={() => handleDeleteUser(u.id, u.fullName)}
                                style={{
                                  color: '#ef4444',
                                  padding: '6px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                }}
                                title="Delete User"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
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
          /* ============================================================================ */
          /* ROLES & SYSTEM GROUPS TAB                                                    */
          /* ============================================================================ */
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Configured Roles & Groups</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  Define system roles, monitor assigned member counts, and configure access permissions.
                </div>
              </div>
              <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsAddRoleModalOpen(true)}>
                Add Role
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {roles.map((r) => {
                const isSystemAdmin = r.id === 'admin';
                const userCount = Number(r.usersCount || 0);

                return (
                  <div
                    key={r.id}
                    style={{
                      padding: '22px',
                      borderRadius: '14px',
                      border: '1.5px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              backgroundColor: isSystemAdmin ? '#eef2ff' : '#f1f5f9',
                              color: isSystemAdmin ? '#4f46e5' : '#334155',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Shield size={18} />
                          </div>
                          <div>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{r.name}</span>
                            <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                              role_id: {r.id}
                            </div>
                          </div>
                        </div>

                        {/* Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {r.isSystemRole && (
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#fef3c7',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#b45309',
                              }}
                            >
                              System
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p style={{ fontSize: '13px', color: '#64748b', marginTop: '12px', minHeight: '36px', lineHeight: 1.5 }}>
                        {r.description || 'System access role for workspace permission governance.'}
                      </p>
                    </div>

                    {/* Bottom Metadata & Actions */}
                    <div
                      style={{
                        paddingTop: '14px',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569' }}>
                        <Users size={14} color="#64748b" />
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{userCount}</span>
                        <span>{userCount === 1 ? 'user assigned' : 'users assigned'}</span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => openEditRoleModal(r)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            color: '#334155',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Edit role name & description"
                        >
                          <Edit2 size={13} /> Edit
                        </button>

                        <button
                          onClick={() => openDeleteRoleModal(r)}
                          disabled={isSystemAdmin}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid #fee2e2',
                            backgroundColor: isSystemAdmin ? '#f8fafc' : '#fef2f2',
                            color: isSystemAdmin ? '#94a3b8' : '#dc2626',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: isSystemAdmin ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: isSystemAdmin ? 0.5 : 1,
                          }}
                          title={isSystemAdmin ? 'Admin role cannot be deleted' : 'Delete this role'}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================================ */}
      {/* MODAL: ADD NEW USER                                                          */}
      {/* ============================================================================ */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Add New User"
        subtitle="Create an account and assign a workspace role."
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
              placeholder="e.g. Engineering, Sales"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
            />
          </div>

          <Input
            label="Phone Number"
            placeholder="e.g. +91 98765 43210"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />

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

      {/* ============================================================================ */}
      {/* MODAL: EDIT USER & ROLE                                                      */}
      {/* ============================================================================ */}
      <Modal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
        title="Edit User Account"
        subtitle={`Modify user details and assign role for "${editingUser?.fullName}".`}
      >
        <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Full Name"
            required
            value={editFullName}
            onChange={(e) => setEditFullName(e.target.value)}
          />

          <Input
            label="Email Address"
            required
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Assigned Role *
              </label>
              <select
                value={editRoleId}
                onChange={(e) => setEditRoleId(e.target.value)}
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
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Department"
              value={editDept}
              onChange={(e) => setEditDept(e.target.value)}
            />
          </div>

          <Input
            label="Phone Number"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <input
              type="checkbox"
              id="editIsActive"
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#4f46e5', cursor: 'pointer' }}
            />
            <label htmlFor="editIsActive" style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>
              Active User Account
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsEditUserModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================================ */}
      {/* MODAL: ADD NEW ROLE                                                          */}
      {/* ============================================================================ */}
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
                boxSizing: 'border-box',
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

      {/* ============================================================================ */}
      {/* MODAL: EDIT ROLE                                                             */}
      {/* ============================================================================ */}
      <Modal
        isOpen={isEditRoleModalOpen}
        onClose={() => setIsEditRoleModalOpen(false)}
        title="Edit Role"
        subtitle={`Update display name and description for "${editingRole?.name}".`}
      >
        <form onSubmit={handleUpdateRole} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Role Name"
            required
            value={editRoleName}
            onChange={(e) => setEditRoleName(e.target.value)}
          />

          <div>
            <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
              Description
            </label>
            <textarea
              value={editRoleDesc}
              onChange={(e) => setEditRoleDesc(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                outline: 'none',
                fontSize: '13.5px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsEditRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================================ */}
      {/* MODAL: CONFIRM DELETE ROLE                                                   */}
      {/* ============================================================================ */}
      <Modal
        isOpen={isDeleteRoleModalOpen}
        onClose={() => setIsDeleteRoleModalOpen(false)}
        title="Delete Role"
        subtitle={`Are you sure you want to delete role "${roleToDelete?.name}"?`}
      >
        <div>
          {roleToDelete?.usersCount > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fef3c7',
                  color: '#b45309',
                }}
              >
                <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                  <strong>{roleToDelete.usersCount} active user(s)</strong> are currently assigned to this role.
                  Please choose a role to reassign them to before deletion:
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                  Reassign Active Users To:
                </label>
                <select
                  value={reassignTargetRoleId}
                  onChange={(e) => setReassignTargetRoleId(e.target.value)}
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
                  {roles
                    .filter((r) => r.id !== roleToDelete.id)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5 }}>
              This role has no assigned users. Deleting it will permanently remove the role and its associated permissions.
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button variant="secondary" onClick={() => setIsDeleteRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDeleteRole}
              isLoading={isSubmitting}
            >
              {roleToDelete?.usersCount > 0 ? 'Reassign & Delete' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
