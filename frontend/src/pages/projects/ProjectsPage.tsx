import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Project, ProjectStatus } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';

const INITIAL_PROJECTS: (Project & { iconColor: string; icon: React.ReactNode })[] = [
  {
    id: 'p1',
    name: 'QuickChat',
    description: 'Real-time chat application with messaging and file sharing',
    status: 'active',
    tasksCount: 24,
    completedTasksCount: 18,
    progressPercentage: 75,
    createdAt: '28 Oct 2026',
    iconColor: '#8b5cf6',
    icon: <MessageSquare size={16} />,
    members: [
      { id: '1', fullName: 'Anish Borkar', email: 'a@t.com', role: 'admin', isActive: true },
      { id: '2', fullName: 'Priya Sharma', email: 'p@t.com', role: 'user', isActive: true },
      { id: '3', fullName: 'Rahul Kumar', email: 'r@t.com', role: 'user', isActive: true },
    ],
  },
  {
    id: 'p2',
    name: 'Task Management',
    description: 'Project and task tracking system',
    status: 'active',
    tasksCount: 18,
    completedTasksCount: 11,
    progressPercentage: 60,
    createdAt: '20 Oct 2026',
    iconColor: '#3b82f6',
    icon: <Code2 size={16} />,
    members: [
      { id: '1', fullName: 'Anish Borkar', email: 'a@t.com', role: 'admin', isActive: true },
      { id: '3', fullName: 'Rahul Kumar', email: 'r@t.com', role: 'user', isActive: true },
    ],
  },
  {
    id: 'p3',
    name: 'Website Redesign',
    description: 'Marketing website revamp with new UI/UX',
    status: 'active',
    tasksCount: 14,
    completedTasksCount: 6,
    progressPercentage: 43,
    createdAt: '15 Oct 2026',
    iconColor: '#10b981',
    icon: <Layers size={16} />,
    members: [
      { id: '2', fullName: 'Priya Sharma', email: 'p@t.com', role: 'user', isActive: true },
      { id: '4', fullName: 'Amit Patil', email: 'am@t.com', role: 'user', isActive: true },
    ],
  },
  {
    id: 'p4',
    name: 'Mobile App',
    description: 'Cross-platform mobile application (React Native)',
    status: 'in_progress',
    tasksCount: 12,
    completedTasksCount: 4,
    progressPercentage: 33,
    createdAt: '10 Oct 2026',
    iconColor: '#6366f1',
    icon: <Smartphone size={16} />,
    members: [
      { id: '1', fullName: 'Anish Borkar', email: 'a@t.com', role: 'admin', isActive: true },
      { id: '4', fullName: 'Amit Patil', email: 'am@t.com', role: 'user', isActive: true },
    ],
  },
  {
    id: 'p5',
    name: 'Analytics Platform',
    description: 'Internal analytics and reporting tool',
    status: 'in_progress',
    tasksCount: 10,
    completedTasksCount: 2,
    progressPercentage: 20,
    createdAt: '08 Oct 2026',
    iconColor: '#0ea5e9',
    icon: <BarChart size={16} />,
    members: [
      { id: '3', fullName: 'Rahul Kumar', email: 'r@t.com', role: 'user', isActive: true },
    ],
  },
  {
    id: 'p6',
    name: 'File Storage',
    description: 'Secure file storage and sharing',
    status: 'active',
    tasksCount: 8,
    completedTasksCount: 7,
    progressPercentage: 87,
    createdAt: '05 Oct 2026',
    iconColor: '#06b6d4',
    icon: <HardDrive size={16} />,
    members: [
      { id: '1', fullName: 'Anish Borkar', email: 'a@t.com', role: 'admin', isActive: true },
      { id: '2', fullName: 'Priya Sharma', email: 'p@t.com', role: 'user', isActive: true },
    ],
  },
  {
    id: 'p7',
    name: 'Knowledge Base',
    description: 'Team documentation and guides',
    status: 'active',
    tasksCount: 6,
    completedTasksCount: 3,
    progressPercentage: 50,
    createdAt: '02 Oct 2026',
    iconColor: '#ec4899',
    icon: <BookOpen size={16} />,
    members: [
      { id: '4', fullName: 'Amit Patil', email: 'am@t.com', role: 'user', isActive: true },
    ],
  },
  {
    id: 'p8',
    name: 'Client Portal',
    description: 'Client access portal for project updates',
    status: 'on_hold',
    tasksCount: 4,
    completedTasksCount: 1,
    progressPercentage: 25,
    createdAt: '28 Sep 2026',
    iconColor: '#f59e0b',
    icon: <Star size={16} />,
    members: [
      { id: '1', fullName: 'Anish Borkar', email: 'a@t.com', role: 'admin', isActive: true },
    ],
  },
];

export const ProjectsPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New project form state
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState<ProjectStatus>('active');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProject = {
      id: `p-${Date.now()}`,
      name: newProjectName,
      description: newProjectDesc,
      status: newProjectStatus,
      tasksCount: 0,
      completedTasksCount: 0,
      progressPercentage: 0,
      createdAt: 'Just now',
      iconColor: '#4f46e5',
      icon: <Folder size={16} />,
      members: [{ id: user?.id || '1', fullName: user?.fullName || 'Admin', email: user?.email || '', role: 'admin' as const, isActive: true }],
    };

    setProjects([newProject, ...projects]);
    setIsModalOpen(false);
    setNewProjectName('');
    setNewProjectDesc('');
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter((p) => p.id !== id));
    }
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
            Create and manage projects, assign members and track progress
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
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
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
              {filteredProjects.map((project, index) => (
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
                          backgroundColor: `${project.iconColor}15`,
                          color: project.iconColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {project.icon}
                      </div>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{project.name}</span>
                    </div>
                  </td>

                  {/* Description */}
                  <td style={{ padding: '16px 20px', color: '#475569', maxWidth: '240px' }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {project.description}
                    </span>
                  </td>

                  {/* Stacked Members Avatars */}
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {(project.members || []).slice(0, 3).map((m, mIdx) => (
                        <div
                          key={m.id}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#4f46e5',
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
                          {m.fullName.split(' ').map((n) => n[0]).join('')}
                        </div>
                      ))}
                      {(project.members?.length || 0) > 3 && (
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginLeft: '6px' }}>
                          +{project.members!.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Tasks count */}
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#0f172a' }}>
                    {project.tasksCount}
                  </td>

                  {/* Progress bar */}
                  <td style={{ padding: '16px 20px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                        {project.progressPercentage}%
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${project.progressPercentage}%`,
                            height: '100%',
                            backgroundColor: '#4f46e5',
                            borderRadius: '9999px',
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: '16px 20px' }}>
                    <Badge
                      variant={
                        project.status === 'active'
                          ? 'active'
                          : project.status === 'in_progress'
                          ? 'progress'
                          : 'pending'
                      }
                      dot
                    >
                      {project.status === 'active'
                        ? 'Active'
                        : project.status === 'in_progress'
                        ? 'In Progress'
                        : 'On Hold'}
                    </Badge>
                  </td>

                  {/* Created At */}
                  <td style={{ padding: '16px 20px', color: '#64748b' }}>
                    {project.createdAt}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <button style={{ color: '#64748b', padding: '4px', borderRadius: '4px' }} title="View Details">
                        <Eye size={16} />
                      </button>
                      {isAdmin && (
                        <>
                          <button style={{ color: '#4f46e5', padding: '4px', borderRadius: '4px' }} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            style={{ color: '#ef4444', padding: '4px', borderRadius: '4px' }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: '#64748b',
          }}
        >
          <div>Showing 1 - {filteredProjects.length} of {projects.length} projects</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>&lt;</button>
            <button style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: 700 }}>1</button>
            <button style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>&gt;</button>
          </div>
        </div>
      </div>

      {/* Modal: Create Project (Admin Only) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
        subtitle="Define a project, assign status and team members"
      >
        <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Project Name"
            required
            placeholder="e.g. Website Redesign"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />

          <div>
            <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Enter brief project summary..."
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
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
          </div>

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
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
