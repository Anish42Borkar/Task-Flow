export type RoleType = 'admin' | 'user' | 'project_manager' | 'member' | 'viewer';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: RoleType;
  department?: string;
  phone?: string;
  isActive: boolean;
  avatar?: string;
  joinedOn?: string;
  lastLogin?: string;
  createdAt?: string;
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  projectName?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  orderIndex: number;
  dueDate?: string;
  assignees?: User[];
  createdAt: string;
  updatedAt?: string;
}

export type ProjectStatus = 'active' | 'in_progress' | 'completed' | 'on_hold';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  dueDate?: string;
  tasksCount?: number;
  completedTasksCount?: number;
  progressPercentage?: number;
  members?: User[];
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | 'task_assigned'
    | 'task_updated'
    | 'task_completed'
    | 'task_reordered'
    | 'project_updated'
    | 'project_assigned'
    | 'comment'
    | 'info'
    | string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface RolePermission {
  module: 'projects' | 'tasks' | 'user_management' | 'permissions' | 'settings' | 'notifications';
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}
