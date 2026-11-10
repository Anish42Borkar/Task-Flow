/**
 * ============================================================================
 * MANDATORY HAND-CODED COMPONENT: Main Task List UI & Drag-and-Drop Ordering
 * ============================================================================
 * INSTRUCTIONS FOR USER IMPLEMENTATION:
 * The assignment specification strictly requires that the Main Task List UI
 * and Drag-and-Drop functionality be implemented by hand.
 *
 * SPECIFICATION & REQUIREMENTS:
 * 1. Screen Visuals: Reference `Admin/a_clean_minimal_saas_ui_screen_for_tasks_in_t.png`
 * 2. Status Tabs: All, To Do (Pending), In Progress, Completed
 * 3. Project Filter: Dropdown allowing filtering tasks by project
 * 4. Task Table Columns:
 *    - Checkbox
 *    - Task Title
 *    - Project Name
 *    - Status (Pending, In Progress, Completed badge)
 *    - Due Date (with calendar icon)
 *    - Actions (Edit pencil, Delete trash for Admin)
 * 5. Drag-and-Drop Reordering:
 *    - Users can grab and drag task rows to change their position
 *    - On drop: Save new order via `PATCH /api/projects/:projectId/tasks/reorder`
 *    - Persist the order in PostgreSQL database so it stays after page refresh!
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  GripVertical,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Task, TaskStatus } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';

const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Update project documentation',
    description: 'Update project documentation with latest changes and deployment steps.',
    projectId: 'p3',
    projectName: 'Website Redesign',
    status: 'In Progress',
    orderIndex: 1,
    dueDate: 'Nov 30, 2026',
    createdAt: '2026-11-01',
  },
  {
    id: 't2',
    title: 'Fix login issue',
    description: 'Fix authentication token expiry and redirect loop on mobile.',
    projectId: 'p4',
    projectName: 'Mobile App',
    status: 'In Progress',
    orderIndex: 2,
    dueDate: 'Dec 15, 2026',
    createdAt: '2026-11-02',
  },
  {
    id: 't3',
    title: 'Review pull request',
    description: 'Review PR #42 for database schema migration and indexes.',
    projectId: 'p1',
    projectName: 'API Integration',
    status: 'Pending',
    orderIndex: 3,
    dueDate: 'Dec 18, 2026',
    createdAt: '2026-11-03',
  },
  {
    id: 't4',
    title: 'Prepare release notes',
    description: 'Summarize changelog and breaking changes for v1.0 release.',
    projectId: 'p4',
    projectName: 'Mobile App',
    status: 'Pending',
    orderIndex: 4,
    dueDate: 'Dec 20, 2026',
    createdAt: '2026-11-04',
  },
  {
    id: 't5',
    title: 'Integrate authentication',
    description: 'Implement JWT authentication and RBAC guards.',
    projectId: 'p1',
    projectName: 'API Integration',
    status: 'Completed',
    orderIndex: 5,
    dueDate: 'Nov 10, 2026',
    createdAt: '2026-11-05',
  },
];

export const TasksPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activeTab, setActiveTab] = useState<'All' | 'To Do' | 'In Progress' | 'Completed'>('All');
  const [projectFilter, setProjectFilter] = useState('All Projects');
  const [search, setSearch] = useState('');

  // Create Task Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProject, setNewProject] = useState('Website Redesign');
  const [newStatus, setNewStatus] = useState<TaskStatus>('Pending');
  const [newDueDate, setNewDueDate] = useState('Nov 30, 2026');
  const [newDescription, setNewDescription] = useState('');

  // Filter tasks based on activeTab, project, and search
  const filteredTasks = tasks.filter((task) => {
    const matchesTab =
      activeTab === 'All' ||
      (activeTab === 'To Do' && task.status === 'Pending') ||
      task.status === activeTab;
    const matchesProject = projectFilter === 'All Projects' || task.projectName === projectFilter;
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesProject && matchesSearch;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: `t-${Date.now()}`,
      title: newTitle,
      description: newDescription,
      projectId: 'p-custom',
      projectName: newProject,
      status: newStatus,
      orderIndex: tasks.length + 1,
      dueDate: newDueDate,
      createdAt: new Date().toISOString(),
    };

    setTasks([...tasks, newTask]);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDescription('');
  };

  const handleDeleteTask = (id: string) => {
    if (!isAdmin) {
      alert('Only administrators have permission to delete tasks.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  /**
   * =========================================================================
   * TODO: [HAND-CODED MANDATORY IMPLEMENTATION] Drag-and-Drop Task Ordering
   * =========================================================================
   * Implement your drag-and-drop row handlers here (e.g. HTML5 Drag & Drop or library).
   * Persist the reordered array to the backend API:
   * await api.patch(`/projects/${projectId}/tasks/reorder`, { orderedTaskIds });
   * =========================================================================
   */
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const reordered = [...tasks];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    // Update orderIndex values
    const updated = reordered.map((t, idx) => ({ ...t, orderIndex: idx + 1 }));
    setTasks(updated);

    // TODO: Send updated order to backend API for database persistence
    // api.patch(`/projects/${moved.projectId}/tasks/reorder`, {
    //   orderedTaskIds: updated.map(t => t.id)
    // });
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>Tasks</h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
            Manage and track all your tasks.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Search Box */}
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
              placeholder="Search tasks..."
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
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Task
          </Button>
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
        {/* Filter Pills Bar & Project Selector */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {(['All', 'To Do', 'In Progress', 'Completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '7px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: activeTab === tab ? '#4f46e5' : '#f8fafc',
                  color: activeTab === tab ? '#ffffff' : '#475569',
                  border: activeTab === tab ? 'none' : '1px solid #e2e8f0',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Project Selector Dropdown */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '13.5px',
              color: '#334155',
              outline: 'none',
              fontWeight: 500,
            }}
          >
            <option>All Projects</option>
            <option>Website Redesign</option>
            <option>Mobile App</option>
            <option>API Integration</option>
          </select>
        </div>

        {/* Task Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: '12.5px' }}>
                <th style={{ padding: '14px 20px', width: '30px' }}>
                  <GripVertical size={16} color="#94a3b8" />
                </th>
                <th style={{ padding: '14px 20px', width: '40px' }}>
                  <input type="checkbox" style={{ accentColor: '#4f46e5', width: '16px', height: '16px', borderRadius: '4px' }} />
                </th>
                <th style={{ padding: '14px 20px' }}>Task Title</th>
                <th style={{ padding: '14px 20px' }}>Project</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px' }}>Due Date</th>
                <th style={{ padding: '14px 20px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, index) => (
                <tr
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'grab',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '16px 20px', color: '#94a3b8' }}>
                    <GripVertical size={16} />
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <input type="checkbox" style={{ accentColor: '#4f46e5', width: '16px', height: '16px', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#0f172a' }}>
                    {task.title}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#475569' }}>
                    {task.projectName}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <Badge
                      variant={
                        task.status === 'Completed'
                          ? 'completed'
                          : task.status === 'In Progress'
                          ? 'progress'
                          : 'pending'
                      }
                    >
                      {task.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#94a3b8" />
                      <span>{task.dueDate}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <button style={{ color: '#64748b', padding: '4px' }} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          style={{ color: '#ef4444', padding: '4px' }}
                          title="Delete (Admin only)"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Task */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Task"
        subtitle="Add a new task to a project."
      >
        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Task Title"
            required
            placeholder="Enter task title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Project *
              </label>
              <select
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
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
                <option>Website Redesign</option>
                <option>Mobile App</option>
                <option>API Integration</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Status *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
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
                <option value="Pending">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <Input
            label="Due Date"
            type="text"
            placeholder="Select due date (e.g. Nov 30, 2026)"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />

          <div>
            <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Add task description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
