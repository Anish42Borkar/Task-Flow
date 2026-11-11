import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Users,
  MessageSquare,
  Code2,
  Layers,
  Smartphone,
  BarChart,
  HardDrive,
  BookOpen,
  Star,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Project, ProjectStatus } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { api } from '../../services/api';

const ICONS = [
  <Layers size={16} key="1" />,
  <Smartphone size={16} key="2" />,
  <MessageSquare size={16} key="3" />,
  <Code2 size={16} key="4" />,
  <BarChart size={16} key="5" />,
  <HardDrive size={16} key="6" />,
];

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#6366f1', '#0ea5e9', '#ec4899', '#f59e0b'];

export const ProjectsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addToast } = useNotificationStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [projects, setProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Project Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState<ProjectStatus>('active');
  const [newProjectDueDate, setNewProjectDueDate] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Project Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('active');

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const data: any = await api.get('/projects');
      setProjects(Array.isArray(data) ? data : []);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to load projects', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data: any = await api.get('/users?limit=50');
      const list = data?.data || data?.users || (Array.isArray(data) ? data : []);
      setAllUsers(list);
    } catch (err) {
      console.warn('Failed to load users for project members selection');
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [fetchProjects, fetchUsers]);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      setIsSubmitting(true);
      await api.post('/projects', {
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || undefined,
        status: newProjectStatus,
        dueDate: newProjectDueDate ? new Date(newProjectDueDate).toISOString() : undefined,
        memberIds: selectedMemberIds,
      });

      addToast('Success', `Project "${newProjectName}" created successfully`, 'success');
      setIsModalOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
      setSelectedMemberIds([]);
      fetchProjects();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to create project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditDesc(project.description || '');
    setEditStatus(project.status);
    setIsEditModalOpen(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editName.trim()) return;

    try {
      setIsSubmitting(true);
      await api.patch(`/projects/${editingProject.id}`, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        status: editStatus,
      });

      addToast('Success', `Project updated successfully`, 'success');
      setIsEditModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!isAdmin) {
      addToast('Permission Denied', 'Only administrators can delete projects', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to delete project "${name}" and all its tasks?`)) {
      try {
        await api.delete(`/projects/${id}`);
        setProjects((prev) => prev.filter((p) => p.id !== id));
        addToast('Project Deleted', `"${name}" removed`, 'info');
      } catch (err: any) {
        addToast('Error', err.message || 'Failed to delete project', 'error');
      }
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  return (
    <div>
      {/* Page Heading */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Folder size={16} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>Projects</h1>
          </div>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
            {isAdmin
              ? 'Create and manage projects, assign members, and track real-time delivery.'
              : 'Projects you have been assigned to as an active team member.'}
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
        {/* Top Control Bar */}
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
            All Projects ({filteredProjects.length})
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search Input */}
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
                placeholder="Search projects..."
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

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                fontSize: '13.5px',
                color: '#334155',
                outline: 'none',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>

            {/* Create Project Button (Admin Only) */}
            {isAdmin && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setIsModalOpen(true)}
              >
                Create Project
              </Button>
            )}
          </div>
        </div>

        {/* Projects Table */}
        <div style={{ overflowX: 'auto' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#64748b', gap: '10px' }}>
              <Loader2 size={24} className="spin-animate" />
              <span>Loading projects...</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <CheckCircle2 size={24} color="#94a3b8" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>No projects found</h3>
              <p style={{ fontSize: '13.5px', marginTop: '4px' }}>
                {search ? 'Try adjusting your search' : 'No projects are assigned to your account.'}
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: '12.5px' }}>
                  <th style={{ padding: '14px 20px', width: '40px' }}>#</th>
                  <th style={{ padding: '14px 20px' }}>Project Name</th>
                  <th style={{ padding: '14px 20px' }}>Description</th>
                  <th style={{ padding: '14px 20px' }}>Members</th>
                  <th style={{ padding: '14px 20px' }}>Tasks</th>
                  <th style={{ padding: '14px 20px', width: '140px' }}>Progress</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px' }}>Created At</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project, index) => {
                  const iconColor = COLORS[index % COLORS.length];
                  const icon = ICONS[index % ICONS.length];

                  return (
                    <tr
                      key={project.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '16px 20px', color: '#94a3b8' }}>{index + 1}</td>

                      {/* Project Name + Icon */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: `${iconColor}15`,
                              color: iconColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {icon}
                          </div>
                          <div>
                            <span
                              onClick={() => navigate(`/tasks?projectId=${project.id}`)}
                              style={{ fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
                            >
                              {project.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td style={{ padding: '16px 20px', color: '#64748b', maxWidth: '240px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {project.description || '—'}
                        </div>
                      </td>

                      {/* Members Avatar Pile */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {project.members && project.members.length > 0 ? (
                            project.members.slice(0, 3).map((m: any, mIdx: number) => {
                              const initials = m.fullName
                                ? m.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                                : 'U';
                              return (
                                <div
                                  key={m.id || mIdx}
                                  title={m.fullName}
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    backgroundColor: COLORS[mIdx % COLORS.length],
                                    color: '#ffffff',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid #ffffff',
                                    marginLeft: mIdx > 0 ? '-8px' : '0',
                                  }}
                                >
                                  {initials}
                                </div>
                              );
                            })
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>None</span>
                          )}
                          {project.members && project.members.length > 3 && (
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: '#e2e8f0',
                                color: '#475569',
                                fontSize: '10px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid #ffffff',
                                marginLeft: '-8px',
                              }}
                            >
                              +{project.members.length - 3}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Tasks Count */}
                      <td style={{ padding: '16px 20px', color: '#0f172a', fontWeight: 600 }}>
                        {project.completedTasksCount || 0} / {project.tasksCount || 0}
                      </td>

                      {/* Progress Bar */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${project.progressPercentage || 0}%`,
                                height: '100%',
                                backgroundColor:
                                  (project.progressPercentage || 0) > 70
                                    ? '#10b981'
                                    : (project.progressPercentage || 0) > 30
                                    ? '#3b82f6'
                                    : '#f59e0b',
                                borderRadius: '3px',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', minWidth: '32px' }}>
                            {project.progressPercentage || 0}%
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '16px 20px' }}>
                        <Badge
                          variant={
                            project.status === 'active' || project.status === 'completed'
                              ? 'completed'
                              : project.status === 'in_progress'
                              ? 'progress'
                              : 'pending'
                          }
                        >
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </td>

                      {/* Created At */}
                      <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '12.5px' }}>
                        {project.createdAt
                          ? new Date(project.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => navigate(`/tasks?projectId=${project.id}`)}
                            style={{ color: '#4f46e5', padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            title="View Tasks"
                          >
                            <Eye size={16} />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => openEditModal(project)}
                                style={{ color: '#64748b', padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                title="Edit Project"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteProject(project.id, project.name)}
                                style={{ color: '#ef4444', padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                title="Delete Project"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
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

      {/* Modal: Create Project (Admin Only) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
        subtitle="Set up a workspace and assign team members."
      >
        <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Project Name"
            required
            placeholder="e.g. NextGen Mobile Portal"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />

          <div>
            <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
              Description
            </label>
            <textarea
              placeholder="Brief description of project deliverables and goals..."
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Status
              </label>
              <select
                value={newProjectStatus}
                onChange={(e) => setNewProjectStatus(e.target.value as ProjectStatus)}
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
                <option value="active">Active</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Due Date
              </label>
              <input
                type="date"
                value={newProjectDueDate}
                onChange={(e) => setNewProjectDueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                  outline: 'none',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          {/* Member Selection Checkboxes */}
          {allUsers.length > 0 && (
            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '8px', display: 'block' }}>
                Assign Project Members
              </label>
              <div
                style={{
                  maxHeight: '130px',
                  overflowY: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {allUsers.map((u) => (
                  <label
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      backgroundColor: selectedMemberIds.includes(u.id) ? '#f0fdf4' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(u.id)}
                      onChange={() => toggleMemberSelection(u.id)}
                      style={{ accentColor: '#4f46e5', width: '15px', height: '15px' }}
                    />
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{u.fullName}</span>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>({u.email})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Project */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Project"
        subtitle="Update project settings."
      >
        <form onSubmit={handleUpdateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Project Name"
            required
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <div>
            <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
              Description
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
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

          <div>
            <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
              Status
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
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
              <option value="active">Active</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
