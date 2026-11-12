import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  GripVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Filter,
  X,
  ChevronUp,
  ChevronDown,
  Layers,
  User as UserIcon,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Task, TaskStatus, User } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { api } from '../../services/api';
import { getSocket, joinProjectRoom, leaveProjectRoom } from '../../services/socket';
import { formatDateWithSetting } from '../../utils/date';

interface LiveProject {
  id: string;
  name: string;
  description?: string;
  status?: string;
}

export const TasksPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addToast } = useNotificationStore();
  const isAdmin = user?.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();

  const urlProjectId = searchParams.get('projectId') || searchParams.get('project');

  const [projects, setProjects] = useState<LiveProject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'To Do' | 'In Progress' | 'Completed'>('All');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(urlProjectId || 'all');
  const [search, setSearch] = useState('');

  // Drag and Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'above' | 'below' | null>(null);

  // Sync selectedProjectId if URL params change
  useEffect(() => {
    const pId = searchParams.get('projectId') || searchParams.get('project') || 'all';
    setSelectedProjectId(pId);
    if (pId !== 'all') {
      setCreateProjectId(pId);
    }
  }, [searchParams]);

  // Create Task Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createProjectId, setCreateProjectId] = useState('');
  const [createStatus, setCreateStatus] = useState<TaskStatus>('Pending');
  const [createPriority, setCreatePriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [createDueDate, setCreateDueDate] = useState('');
  const [createAssigneeIds, setCreateAssigneeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Task Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus>('Pending');
  const [editPriority, setEditPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssigneeIds, setEditAssigneeIds] = useState<string[]>([]);

  // 1. Fetch accessible projects
  const fetchProjects = useCallback(async () => {
    try {
      const data: any = await api.get('/projects');
      const projList = Array.isArray(data) ? data : [];
      setProjects(projList);
      if (projList.length > 0 && !createProjectId) {
        setCreateProjectId(projList[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load projects:', err);
    }
  }, [createProjectId]);

  // 2. Fetch users for assignee selection
  const fetchUsers = useCallback(async () => {
    try {
      const res: any = await api.get('/users');
      const uList = res?.data || res?.users || (Array.isArray(res) ? res : []);
      setAvailableUsers(uList);
    } catch (err) {
      // Non-admin may not have access to /users, which is expected
    }
  }, []);

  // 3. Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      let data: any;
      if (selectedProjectId === 'all') {
        data = await api.get('/tasks');
      } else {
        data = await api.get(`/projects/${selectedProjectId}/tasks`);
      }
      setTasks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [fetchProjects, fetchUsers]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 4. Socket.IO Real-time listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (selectedProjectId !== 'all') {
      joinProjectRoom(selectedProjectId);
    }

    const handleTaskCreated = (newTask: any) => {
      setTasks((prev) => {
        if (prev.some((t) => t.id === newTask.id)) return prev;
        return [...prev, newTask];
      });
      addToast('Task Created', `New task "${newTask.title}" was created`, 'info');
    };

    const handleTaskUpdated = (updated: any) => {
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
    };

    const handleStatusChanged = ({ taskId, status, actor }: any) => {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
      addToast('Status Changed', `Task status updated to "${status}" by ${actor?.fullName || 'team member'}`, 'info');
    };

    const handleTaskReordered = ({ projectId, orderedTaskIds }: any) => {
      if (selectedProjectId === 'all' || selectedProjectId === projectId) {
        setTasks((prev) => {
          const map = new Map(prev.map((t) => [t.id, t]));
          const reordered: Task[] = [];
          for (let i = 0; i < orderedTaskIds.length; i++) {
            const t = map.get(orderedTaskIds[i]);
            if (t) {
              reordered.push({ ...t, orderIndex: i + 1 });
              map.delete(orderedTaskIds[i]);
            }
          }
          for (const remaining of map.values()) {
            reordered.push(remaining);
          }
          return reordered;
        });
      }
    };

    const handleTaskDeleted = ({ taskId }: any) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:status_changed', handleStatusChanged);
    socket.on('task:reordered', handleTaskReordered);
    socket.on('task:deleted', handleTaskDeleted);

    return () => {
      if (selectedProjectId !== 'all') {
        leaveProjectRoom(selectedProjectId);
      }
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:status_changed', handleStatusChanged);
      socket.off('task:reordered', handleTaskReordered);
      socket.off('task:deleted', handleTaskDeleted);
    };
  }, [selectedProjectId, addToast]);

  // Statistics counts
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'Pending').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    return { total, pending, inProgress, completed };
  }, [tasks]);

  // Filter tasks based on activeTab, project, and search
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesTab =
        activeTab === 'All' ||
        (activeTab === 'To Do' && task.status === 'Pending') ||
        task.status === activeTab;
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(search.toLowerCase())) ||
        (task.projectName && task.projectName.toLowerCase().includes(search.toLowerCase()));
      return matchesTab && matchesSearch;
    });
  }, [tasks, activeTab, search]);

  // Handle Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim() || !createProjectId) return;

    try {
      setIsSubmitting(true);
      await api.post(`/projects/${createProjectId}/tasks`, {
        title: createTitle.trim(),
        description: createDesc.trim() || undefined,
        status: createStatus,
        priority: createPriority,
        dueDate: createDueDate ? new Date(createDueDate).toISOString() : undefined,
        assigneeIds: createAssigneeIds.length > 0 ? createAssigneeIds : undefined,
      });

      addToast('Success', `Task "${createTitle}" created successfully`, 'success');
      setIsCreateModalOpen(false);
      setCreateTitle('');
      setCreateDesc('');
      setCreateAssigneeIds([]);
      fetchTasks();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to create task', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Project Filter Change
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    if (projectId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ projectId });
      setCreateProjectId(projectId);
    }
  };

  // Handle Edit Task
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditStatus(task.status as TaskStatus);
    setEditPriority(task.priority || 'Medium');
    setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setEditAssigneeIds((task.assignees || []).map((a) => a.id));
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    try {
      setIsSubmitting(true);
      await api.put(`/tasks/${editingTask.id}`, {
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
        status: editStatus,
        priority: editPriority,
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : undefined,
        assigneeIds: editAssigneeIds,
      });

      addToast('Success', 'Task updated successfully', 'success');
      setIsEditModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update task', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Quick Change
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as TaskStatus } : t)));
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      addToast('Status Updated', `Task moved to ${newStatus}`, 'success');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update task status', 'error');
      fetchTasks();
    }
  };

  // Handle Delete Task (Admin Only)
  const handleDeleteTask = async (id: string, title: string) => {
    if (!isAdmin) {
      addToast('Permission Denied', 'Only administrators can delete tasks', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      try {
        await api.delete(`/tasks/${id}`);
        setTasks((prev) => prev.filter((t) => t.id !== id));
        addToast('Task Deleted', `"${title}" has been removed`, 'info');
      } catch (err: any) {
        addToast('Error', err.message || 'Failed to delete task', 'error');
      }
    }
  };

  // ============================================================================
  // MANDATORY DRAG-AND-DROP & TASK ORDERING REORDER LOGIC
  // ============================================================================

  const persistReorderedTasks = async (targetProjectId: string, orderedTaskIds: string[]) => {
    try {
      await api.patch(`/projects/${targetProjectId}/tasks/reorder`, {
        orderedTaskIds,
      });
      addToast('Tasks Reordered', 'New task order persisted to database', 'success');
    } catch (err: any) {
      addToast('Reorder Error', err.message || 'Could not save new task ordering', 'error');
      fetchTasks(); // Revert on failure
    }
  };

  // 1-Click Move Up / Move Down buttons for Accessibility
  const handleMoveTask = async (taskId: string, direction: 'up' | 'down') => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const targetProjectId = task.projectId;
    const projectTasks = tasks.filter((t) => t.projectId === targetProjectId);
    const currentIndex = projectTasks.findIndex((t) => t.id === taskId);

    if (direction === 'up' && currentIndex <= 0) return;
    if (direction === 'down' && currentIndex >= projectTasks.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const reorderedProjectTasks = [...projectTasks];
    const [moved] = reorderedProjectTasks.splice(currentIndex, 1);
    reorderedProjectTasks.splice(targetIndex, 0, moved);

    const orderedTaskIds = reorderedProjectTasks.map((t) => t.id);

    // Optimistic UI update
    setTasks((prev) => {
      const otherTasks = prev.filter((t) => t.projectId !== targetProjectId);
      const updated = reorderedProjectTasks.map((t, idx) => ({ ...t, orderIndex: idx + 1 }));
      return [...otherTasks, ...updated];
    });

    await persistReorderedTasks(targetProjectId, orderedTaskIds);
  };

  // HTML5 Drag Events
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedTaskId === targetTaskId) {
      setDragOverTaskId(null);
      setDragPosition(null);
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const position = offsetY < rect.height / 2 ? 'above' : 'below';

    setDragOverTaskId(targetTaskId);
    setDragPosition(position);
  };

  const handleDragLeave = () => {
    setDragOverTaskId(null);
    setDragPosition(null);
  };

  const handleDrop = async (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    const sourceTaskId = e.dataTransfer.getData('text/plain') || draggedTaskId;

    const currentPosition = dragPosition;
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDragPosition(null);

    if (!sourceTaskId || sourceTaskId === targetTaskId) return;

    const sourceTask = tasks.find((t) => t.id === sourceTaskId);
    const targetTask = tasks.find((t) => t.id === targetTaskId);

    if (!sourceTask || !targetTask) return;

    // Cross-project check
    if (sourceTask.projectId !== targetTask.projectId) {
      addToast(
        'Notice',
        'Reordering is scoped within the same project. Please filter by project or drag within the same project.',
        'info',
      );
      return;
    }

    const targetProjectId = targetTask.projectId;
    const projectTasks = tasks.filter((t) => t.projectId === targetProjectId);

    const oldIndex = projectTasks.findIndex((t) => t.id === sourceTaskId);
    let newIndex = projectTasks.findIndex((t) => t.id === targetTaskId);

    if (oldIndex === -1 || newIndex === -1) return;

    if (currentPosition === 'below' && oldIndex < newIndex) {
      // dropping below a later item
    } else if (currentPosition === 'above' && oldIndex > newIndex) {
      // dropping above an earlier item
    } else if (currentPosition === 'below') {
      newIndex += 1;
    }

    const reorderedProjectTasks = [...projectTasks];
    const [moved] = reorderedProjectTasks.splice(oldIndex, 1);

    // Clamp insertion point
    const insertAt = Math.min(Math.max(newIndex, 0), reorderedProjectTasks.length);
    reorderedProjectTasks.splice(insertAt, 0, moved);

    const orderedTaskIds = reorderedProjectTasks.map((t) => t.id);

    // Optimistic UI state update
    setTasks((prev) => {
      const otherTasks = prev.filter((t) => t.projectId !== targetProjectId);
      const updatedProjectTasks = reorderedProjectTasks.map((t, idx) => ({
        ...t,
        orderIndex: idx + 1,
      }));
      return [...otherTasks, ...updatedProjectTasks];
    });

    // Backend PostgreSQL persistence API call
    await persistReorderedTasks(targetProjectId, orderedTaskIds);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDragPosition(null);
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>Tasks</h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
            Plan, reorder, and track tasks with persistent drag-and-drop sequencing.
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
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} color="#94a3b8" />
              </button>
            )}
          </div>

          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              if (selectedProjectId !== 'all') {
                setCreateProjectId(selectedProjectId);
              }
              setIsCreateModalOpen(true);
            }}
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* Task Summary Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#eef2ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>TOTAL TASKS</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{stats.total}</div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>TO DO</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{stats.pending}</div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#e0e7ff',
              color: '#4338ca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>IN PROGRESS</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{stats.inProgress}</div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>COMPLETED</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{stats.completed}</div>
          </div>
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
        {/* Active Project Filter Notice Banner */}
        {selectedProjectId !== 'all' && (
          <div
            style={{
              padding: '12px 24px',
              backgroundColor: '#eef2ff',
              borderBottom: '1px solid #e0e7ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: '#3730a3',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Filtering tasks for:</span>
              <span
                style={{
                  fontWeight: 700,
                  backgroundColor: '#ffffff',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  border: '1px solid #c7d2fe',
                  color: '#4338ca',
                }}
              >
                {projects.find((p) => p.id === selectedProjectId)?.name || 'Selected Project'}
              </span>
              <span style={{ color: '#6366f1', fontSize: '12px' }}>
                (Drag & drop rows using the grip handle or arrows to reorder)
              </span>
            </div>
            <button
              onClick={() => handleProjectSelect('all')}
              style={{
                background: 'none',
                border: 'none',
                color: '#4f46e5',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12.5px',
              }}
            >
              <X size={14} /> Clear Filter (View All Projects)
            </button>
          </div>
        )}

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
            {[
              { label: 'All', count: stats.total },
              { label: 'To Do', count: stats.pending },
              { label: 'In Progress', count: stats.inProgress },
              { label: 'Completed', count: stats.completed },
            ].map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label as any)}
                style={{
                  padding: '7px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: activeTab === tab.label ? '#4f46e5' : '#f8fafc',
                  color: activeTab === tab.label ? '#ffffff' : '#475569',
                  border: activeTab === tab.label ? 'none' : '1px solid #e2e8f0',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: activeTab === tab.label ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                    color: activeTab === tab.label ? '#ffffff' : '#475569',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Project Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="#64748b" />
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectSelect(e.target.value)}
              style={{
                padding: '8px 14px',
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
              <option value="all">All Accessible Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Task Table */}
        <div style={{ overflowX: 'auto' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#64748b', gap: '10px' }}>
              <Loader2 size={24} className="animate-spin" />
              <span>Loading tasks...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <CheckCircle2 size={24} color="#94a3b8" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>No tasks found</h3>
              <p style={{ fontSize: '13.5px', marginTop: '4px' }}>
                {search ? 'No tasks match your search criteria' : 'Create your first task to get started'}
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: '12.5px' }}>
                  <th style={{ padding: '14px 16px', width: '56px', textAlign: 'center' }} title="Drag handle / Reorder">
                    <GripVertical size={16} color="#94a3b8" style={{ display: 'inline-block' }} />
                  </th>
                  <th style={{ padding: '14px 16px', width: '45px' }}>#</th>
                  <th style={{ padding: '14px 20px', minWidth: '220px' }}>Task Title</th>
                  <th style={{ padding: '14px 16px' }}>Project</th>
                  <th style={{ padding: '14px 16px' }}>Assignees</th>
                  <th style={{ padding: '14px 16px' }}>Priority</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Due Date</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, index) => {
                  const isBeingDragged = draggedTaskId === task.id;
                  const isDropTarget = dragOverTaskId === task.id;

                  // Find index within the same project for Move Up/Down bounds
                  const sameProjectTasks = tasks.filter((t) => t.projectId === task.projectId);
                  const projectIndex = sameProjectTasks.findIndex((t) => t.id === task.id);
                  const canMoveUp = projectIndex > 0;
                  const canMoveDown = projectIndex < sameProjectTasks.length - 1;

                  return (
                    <tr
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragOver={(e) => handleDragOver(e, task.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, task.id)}
                      onDragEnd={handleDragEnd}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'grab',
                        transition: 'all 0.15s ease',
                        opacity: isBeingDragged ? 0.45 : 1,
                        backgroundColor: isBeingDragged ? '#f1f5f9' : 'transparent',
                        boxShadow: isDropTarget
                          ? dragPosition === 'above'
                            ? 'inset 0 3px 0 0 #4f46e5'
                            : 'inset 0 -3px 0 0 #4f46e5'
                          : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isBeingDragged) e.currentTarget.style.backgroundColor = '#fafafa';
                      }}
                      onMouseLeave={(e) => {
                        if (!isBeingDragged) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Grip Handle and 1-Click Move Arrows */}
                      <td style={{ padding: '14px 12px', textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span title="Drag to reorder" style={{ cursor: 'grab' }}>
                            <GripVertical size={16} />
                          </span>
                          <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
                            <button
                              onClick={() => handleMoveTask(task.id, 'up')}
                              disabled={!canMoveUp}
                              title="Move task up"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: canMoveUp ? 'pointer' : 'default',
                                opacity: canMoveUp ? 0.7 : 0.2,
                                padding: 0,
                                lineHeight: 1,
                              }}
                            >
                              <ChevronUp size={12} color={canMoveUp ? '#4f46e5' : '#94a3b8'} />
                            </button>
                            <button
                              onClick={() => handleMoveTask(task.id, 'down')}
                              disabled={!canMoveDown}
                              title="Move task down"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: canMoveDown ? 'pointer' : 'default',
                                opacity: canMoveDown ? 0.7 : 0.2,
                                padding: 0,
                                lineHeight: 1,
                              }}
                            >
                              <ChevronDown size={12} color={canMoveDown ? '#4f46e5' : '#94a3b8'} />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Order Number */}
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '12.5px', fontWeight: 600 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            minWidth: '22px',
                            textAlign: 'center',
                          }}
                        >
                          {task.orderIndex || index + 1}
                        </span>
                      </td>

                      {/* Title & Description */}
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0f172a' }}>
                        <div>{task.title}</div>
                        {task.description && (
                          <div
                            style={{
                              fontSize: '12px',
                              color: '#64748b',
                              fontWeight: 400,
                              marginTop: '2px',
                              maxWidth: '360px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={task.description}
                          >
                            {task.description}
                          </div>
                        )}
                      </td>

                      {/* Project Name */}
                      <td style={{ padding: '14px 16px', color: '#475569' }}>
                        <span
                          style={{
                            padding: '3px 9px',
                            borderRadius: '6px',
                            backgroundColor: '#f1f5f9',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#334155',
                          }}
                        >
                          {task.projectName || 'Project'}
                        </span>
                      </td>

                      {/* Assignees */}
                      <td style={{ padding: '14px 16px' }}>
                        {task.assignees && task.assignees.length > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {task.assignees.slice(0, 3).map((a) => (
                              <div
                                key={a.id}
                                title={`${a.fullName} (${a.email})`}
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
                                  backgroundColor: '#4f46e5',
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  border: '1.5px solid #ffffff',
                                }}
                              >
                                {a.fullName
                                  ? a.fullName
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')
                                      .toUpperCase()
                                      .slice(0, 2)
                                  : 'U'}
                              </div>
                            ))}
                            {task.assignees.length > 3 && (
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                                +{task.assignees.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Unassigned</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            backgroundColor:
                              task.priority === 'High'
                                ? '#fee2e2'
                                : task.priority === 'Medium'
                                ? '#fef3c7'
                                : '#e0e7ff',
                            color:
                              task.priority === 'High'
                                ? '#b91c1c'
                                : task.priority === 'Medium'
                                ? '#b45309'
                                : '#4338ca',
                          }}
                        >
                          {task.priority || 'Medium'}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td style={{ padding: '14px 16px' }}>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            outline: 'none',
                            backgroundColor:
                              task.status === 'Completed'
                                ? '#dcfce7'
                                : task.status === 'In Progress'
                                ? '#e0e7ff'
                                : '#fef3c7',
                            color:
                              task.status === 'Completed'
                                ? '#15803d'
                                : task.status === 'In Progress'
                                ? '#4338ca'
                                : '#b45309',
                          }}
                        >
                          <option value="Pending">Pending (To Do)</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>

                      {/* Due Date */}
                      <td style={{ padding: '14px 16px', color: '#475569' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="#94a3b8" />
                          <span>{task.dueDate ? formatDateWithSetting(task.dueDate) : 'No due date'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(task)}
                            style={{
                              color: '#64748b',
                              padding: '6px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              border: 'none',
                              background: 'transparent',
                            }}
                            title="Edit Task"
                          >
                            <Edit2 size={16} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteTask(task.id, task.title)}
                              style={{
                                color: '#ef4444',
                                padding: '6px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                border: 'none',
                                background: 'transparent',
                              }}
                              title="Delete Task (Admin Only)"
                            >
                              <Trash2 size={16} />
                            </button>
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

      {/* Modal: Create Task */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Task"
        subtitle="Add a new task to an accessible project."
      >
        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Task Title"
            required
            placeholder="e.g. Design Dashboard Components"
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
          />

          <div>
            <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
              Description
            </label>
            <textarea
              placeholder="Task details and deliverables..."
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Project *
              </label>
              <select
                value={createProjectId}
                onChange={(e) => setCreateProjectId(e.target.value)}
                required
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
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Status *
              </label>
              <select
                value={createStatus}
                onChange={(e) => setCreateStatus(e.target.value as TaskStatus)}
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
                <option value="Pending">Pending (To Do)</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Priority
              </label>
              <select
                value={createPriority}
                onChange={(e) => setCreatePriority(e.target.value as any)}
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
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Due Date
              </label>
              <input
                type="date"
                value={createDueDate}
                onChange={(e) => setCreateDueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                  outline: 'none',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {availableUsers.length > 0 && (
            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Assignees
              </label>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  padding: '8px',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                }}
              >
                {availableUsers.map((u) => {
                  const isSelected = createAssigneeIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setCreateAssigneeIds((prev) => prev.filter((id) => id !== u.id));
                        } else {
                          setCreateAssigneeIds((prev) => [...prev, u.id]);
                        }
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: isSelected ? '#4f46e5' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#334155',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <UserIcon size={12} />
                      {u.fullName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Task */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Task"
        subtitle="Update task information, priority, and assignees."
      >
        <form onSubmit={handleUpdateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Task Title"
            required
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
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
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
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
                <option value="Pending">Pending (To Do)</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Priority
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as any)}
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
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
              Due Date
            </label>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                outline: 'none',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {availableUsers.length > 0 && (
            <div>
              <label style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Assignees
              </label>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  padding: '8px',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                }}
              >
                {availableUsers.map((u) => {
                  const isSelected = editAssigneeIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setEditAssigneeIds((prev) => prev.filter((id) => id !== u.id));
                        } else {
                          setEditAssigneeIds((prev) => [...prev, u.id]);
                        }
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: isSelected ? '#4f46e5' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#334155',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <UserIcon size={12} />
                      {u.fullName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
