import React, { useState } from 'react';
import {
  Users,
  Shield,
  Search,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  Filter,
} from 'lucide-react';
import { User, RoleType } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';

interface SystemRole {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  createdOn: string;
  badgeColor: string;
}

const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    fullName: 'Anish Borkar',
    email: 'anish.borkar@example.com',
    role: 'admin',
    department: 'IT',
    isActive: true,
    joinedOn: '01 Nov 2026',
    createdAt: '01 Nov 2026',
  },
  {
    id: 'u2',
    fullName: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    role: 'project_manager',
    department: 'Delivery',
    isActive: true,
    joinedOn: '02 Nov 2026',
    createdAt: '02 Nov 2026',
  },
  {
    id: 'u3',
    fullName: 'Rahul Khatre',
    email: 'rahul.khatre@example.com',
    role: 'member',
    department: 'IT',
    isActive: true,
    joinedOn: '03 Nov 2026',
    createdAt: '03 Nov 2026',
  },
  {
    id: 'u4',
    fullName: 'Sneha Desai',
    email: 'sneha.desai@example.com',
    role: 'member',
    department: 'Design',
    isActive: false,
    joinedOn: '04 Nov 2026',
    createdAt: '04 Nov 2026',
  },
  {
    id: 'u5',
    fullName: 'Vishal More',
    email: 'vishal.more@example.com',
    role: 'member',
    department: 'QA',
    isActive: true,
    joinedOn: '05 Nov 2026',
    createdAt: '05 Nov 2026',
  },
];

const INITIAL_ROLES: SystemRole[] = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full access to all features, users, and settings.',
    usersCount: 1,
    createdOn: '01 Nov 2026',
    badgeColor: '#eef2ff',
  },
  {
    id: 'project_manager',
    name: 'Project Manager',
    description: 'Can create and manage projects, tasks, and team members.',
    usersCount: 3,
    createdOn: '02 Nov 2026',
    badgeColor: '#eff6ff',
  },
  {
    id: 'member',
    name: 'Member',
    description: 'Can view projects and manage assigned tasks.',
    usersCount: 18,
    createdOn: '03 Nov 2026',
    badgeColor: '#f1f5f9',
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Can view projects and tasks with read-only access.',
    usersCount: 2,
    createdOn: '04 Nov 2026',
    badgeColor: '#ecfdf5',
  },
];

export const UserManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [usersList, setUsersList] = useState<User[]>(INITIAL_USERS);
  const [rolesList, setRolesList] = useState<SystemRole[]>(INITIAL_ROLES);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);

  // Add User Form state
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<RoleType>('user');
  const [newDepartment, setNewDepartment] = useState('IT');
  const [newPassword, setNewPassword] = useState('');
  const [newStatus, setNewStatus] = useState(true);

  // Add Role Form state
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) return;

    const created: User = {
      id: `u-${Date.now()}`,
      fullName: newFullName,
      email: newEmail,
      phone: newPhone,
      role: newRole,
      department: newDepartment,
      isActive: newStatus,
      createdAt: 'Today',
      joinedOn: 'Today',
    };

    setUsersList([...usersList, created]);
    setIsAddUserModalOpen(false);
    setNewFullName('');
    setNewEmail('');
    setNewPhone('');
    setNewPassword('');
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const createdRole: SystemRole = {
      id: newRoleName.toLowerCase().replace(/\s+/g, '_'),
      name: newRoleName,
      description: newRoleDesc,
      usersCount: 0,
      createdOn: 'Today',
      badgeColor: '#eff6ff',
    };

    setRolesList([...rolesList, createdRole]);
    setIsAddRoleModalOpen(false);
    setNewRoleName('');
    setNewRoleDesc('');
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>User Management</h1>
          </div>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
            Manage users, their roles and access in TaskFlow.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 600,
              backgroundColor: activeTab === 'users' ? '#4f46e5' : 'transparent',
              color: activeTab === 'users' ? '#ffffff' : '#64748b',
              transition: 'all 0.15s ease',
            }}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 600,
              backgroundColor: activeTab === 'roles' ? '#4f46e5' : 'transparent',
              color: activeTab === 'roles' ? '#ffffff' : '#64748b',
              transition: 'all 0.15s ease',
            }}
          >
            Roles
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        /* ======================== USERS TAB ======================== */
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            overflow: 'hidden',
          }}
        >
          {/* Controls Bar */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Users ({usersList.length})
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '13.5px',
                    width: '100%',
                    color: '#0f172a',
                  }}
                />
              </div>

              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setIsAddUserModalOpen(true)}
              >
                Add User
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: '12.5px' }}>
                  <th style={{ padding: '14px 20px', width: '40px' }}>
                    <input type="checkbox" style={{ accentColor: '#4f46e5', width: '16px', height: '16px', borderRadius: '4px' }} />
                  </th>
                  <th style={{ padding: '14px 20px' }}>User</th>
                  <th style={{ padding: '14px 20px' }}>Email</th>
                  <th style={{ padding: '14px 20px' }}>Role</th>
                  <th style={{ padding: '14px 20px' }}>Department</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px' }}>Created On</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr
                    key={u.id}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <input type="checkbox" style={{ accentColor: '#4f46e5', width: '16px', height: '16px', borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#4f46e5',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {u.fullName.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{u.fullName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#475569' }}>{u.email}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          backgroundColor: '#eef2ff',
                          color: '#4f46e5',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#475569' }}>{u.department}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <Badge variant={u.isActive ? 'active' : 'inactive'} dot>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748b' }}>{u.createdAt}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <button style={{ color: '#64748b', padding: '4px' }}>
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ======================== ROLES TAB ======================== */
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            overflow: 'hidden',
          }}
        >
          {/* Controls Bar */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Roles ({rolesList.length})
            </div>

            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setIsAddRoleModalOpen(true)}
            >
              Add Role
            </Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: '12.5px' }}>
                  <th style={{ padding: '14px 20px' }}>Role</th>
                  <th style={{ padding: '14px 20px' }}>Description</th>
                  <th style={{ padding: '14px 20px' }}>Users</th>
                  <th style={{ padding: '14px 20px' }}>Created On</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rolesList.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          backgroundColor: r.badgeColor,
                          color: '#1e293b',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 700,
                        }}
                      >
                        {r.name}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#475569' }}>{r.description}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '3px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                        {r.usersCount}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748b' }}>{r.createdOn}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <button style={{ color: '#4f46e5', padding: '4px' }}>
                          <Edit2 size={16} />
                        </button>
                        <button style={{ color: '#ef4444', padding: '4px' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add User */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Add User"
        subtitle="Create a new user and assign their role and department."
      >
        <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Full Name"
            required
            placeholder="Enter full name"
            value={newFullName}
            onChange={(e) => setNewFullName(e.target.value)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Email"
              required
              type="email"
              placeholder="Enter email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <Input
              label="Phone"
              placeholder="Enter phone number"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Role *
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as RoleType)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', backgroundColor: '#ffffff' }}
              >
                <option value="admin">Admin</option>
                <option value="user">User / Member</option>
                <option value="project_manager">Project Manager</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Department *
              </label>
              <select
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', backgroundColor: '#ffffff' }}
              >
                <option>IT</option>
                <option>Delivery</option>
                <option>Design</option>
                <option>QA</option>
              </select>
            </div>
          </div>

          <Input
            label="Initial Password"
            required
            type="password"
            placeholder="Enter temporary password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="userActive"
              checked={newStatus}
              onChange={(e) => setNewStatus(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
            />
            <label htmlFor="userActive" style={{ fontSize: '13.5px', color: '#1e293b', fontWeight: 600 }}>
              Active Account
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="outline" onClick={() => setIsAddUserModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Role */}
      <Modal
        isOpen={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        title="Add Role"
        subtitle="Create a new role and define its access and description."
      >
        <form onSubmit={handleAddRole} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Role Name"
            required
            placeholder="Enter role name"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
          />

          <div>
            <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Enter role description (optional)"
              value={newRoleDesc}
              maxLength={250}
              onChange={(e) => setNewRoleDesc(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                outline: 'none',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'right', marginTop: '4px' }}>
              {newRoleDesc.length}/250
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="outline" onClick={() => setIsAddRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Role
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
