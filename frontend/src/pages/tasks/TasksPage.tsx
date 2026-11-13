import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
  LayoutList,
  Kanban,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { Task, TaskStatus, User } from "../../types";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import { api } from "../../services/api";
import {
  getSocket,
  joinProjectRoom,
  leaveProjectRoom,
} from "../../services/socket";
import { formatDateWithSetting } from "../../utils/date";

interface LiveProject {
  id: string;
  name: string;
  description?: string;
  status?: string;
}

export const TasksPage: React.FC = () => {
  const { user, hasPermission, fetchProfile } = useAuthStore();
  const { addToast } = useNotificationStore();
  const isAdmin = user?.role === "admin";
  const canViewTasks = isAdmin || hasPermission("tasks", "canView");
  const canCreateTasks = isAdmin || hasPermission("tasks", "canCreate");
  const canEditTasks = isAdmin || hasPermission("tasks", "canEdit");
  const canDeleteTasks = isAdmin || hasPermission("tasks", "canDelete");
  const [searchParams, setSearchParams] = useSearchParams();

  const urlProjectId =
    searchParams.get("projectId") || searchParams.get("project");

  // View Mode: 'table' (List) or 'board' (Kanban)
  const [viewMode, setViewMode] = useState<"table" | "board">(() => {
    return (
      (localStorage.getItem("taskflow_tasks_view_mode") as "table" | "board") ||
      "board"
    );
  });

  const [projects, setProjects] = useState<LiveProject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "All" | "To Do" | "In Progress" | "Completed"
  >("All");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    urlProjectId || "all",
  );
  const [search, setSearch] = useState("");

  // Drag and Drop State for Table View (Reordering)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<"above" | "below" | null>(
    null,
  );

  // Drag and Drop State for Kanban Board View (Status Transition)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Sync selectedProjectId if URL params change
  useEffect(() => {
    const pId =
      searchParams.get("projectId") || searchParams.get("project") || "all";
    setSelectedProjectId(pId);
    if (pId !== "all") {
      setCreateProjectId(pId);
    }
  }, [searchParams]);

  const handleViewModeChange = (mode: "table" | "board") => {
    setViewMode(mode);
    localStorage.setItem("taskflow_tasks_view_mode", mode);
  };

  // Create Task Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createProjectId, setCreateProjectId] = useState("");
  const [createStatus, setCreateStatus] = useState<TaskStatus>("Pending");
  const [createPriority, setCreatePriority] = useState<
    "Low" | "Medium" | "High"
  >("Medium");
  const [createDueDate, setCreateDueDate] = useState("");
  const [createAssigneeIds, setCreateAssigneeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Task Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState<TaskStatus>("Pending");
  const [editPriority, setEditPriority] = useState<"Low" | "Medium" | "High">(
    "Medium",
  );
  const [editDueDate, setEditDueDate] = useState("");
  const [editAssigneeIds, setEditAssigneeIds] = useState<string[]>([]);

  // 1. Fetch accessible projects
  const fetchProjects = useCallback(async () => {
    try {
      const data: any = await api.get("/projects");
      const projList = Array.isArray(data) ? data : [];
      setProjects(projList);
      if (projList.length > 0 && !createProjectId) {
        setCreateProjectId(projList[0].id);
      }
    } catch (err: any) {
      console.error("Failed to load projects:", err);
    }
  }, [createProjectId]);

  // 2. Fetch users for assignee selection
  const fetchUsers = useCallback(async () => {
    try {
      const res: any = await api.get("/users");
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
      if (selectedProjectId === "all") {
        data = await api.get("/tasks");
      } else {
        data = await api.get(`/projects/${selectedProjectId}/tasks`);
      }
      setTasks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load tasks:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchProfile();
    fetchProjects();
    fetchUsers();
  }, [fetchProfile, fetchProjects, fetchUsers]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 4. Socket.IO Real-time listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (selectedProjectId !== "all") {
      joinProjectRoom(selectedProjectId);
    }

    const handleTaskCreated = (payload: any) => {
      const taskData = payload?.task || payload;
      if (!taskData || !taskData.id) return;

      if (selectedProjectId !== "all" && taskData.projectId && taskData.projectId !== selectedProjectId) {
        return;
      }

      setTasks((prev) => {
        if (prev.some((t) => t && t.id === taskData.id)) return prev;
        return [...prev, taskData];
      });

      if (payload?.actor?.id !== user?.id) {
        addToast(
          "Task Created",
          `New task "${taskData.title || 'Untitled'}" was created by ${payload?.actor?.fullName || 'a team member'}`,
          "info",
        );
      }
    };

    const handleTaskUpdated = (payload: any) => {
      const taskData = payload?.task || payload;
      if (taskData?.id) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskData.id ? { ...t, ...taskData } : t)),
        );
      }
    };

    const handleStatusChanged = ({ taskId, status, actor }: any) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status } : t)),
      );
    };

    const handleTaskReordered = ({ projectId, orderedTaskIds }: any) => {
      if (selectedProjectId === "all" || selectedProjectId === projectId) {
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

    socket.on("task:created", handleTaskCreated);
    socket.on("task:updated", handleTaskUpdated);
    socket.on("task:status_changed", handleStatusChanged);
    socket.on("task:reordered", handleTaskReordered);
    socket.on("task:deleted", handleTaskDeleted);

    return () => {
      if (selectedProjectId !== "all") {
        leaveProjectRoom(selectedProjectId);
      }
      socket.off("task:created", handleTaskCreated);
      socket.off("task:updated", handleTaskUpdated);
      socket.off("task:status_changed", handleStatusChanged);
      socket.off("task:reordered", handleTaskReordered);
      socket.off("task:deleted", handleTaskDeleted);
    };
  }, [selectedProjectId, addToast]);

  // Statistics counts
  const stats = useMemo(() => {
    const validTasks = tasks.filter((t) => t && t.id);
    const total = validTasks.length;
    const pending = validTasks.filter((t) => t.status === "Pending").length;
    const inProgress = validTasks.filter((t) => t.status === "In Progress").length;
    const completed = validTasks.filter((t) => t.status === "Completed").length;
    return { total, pending, inProgress, completed };
  }, [tasks]);

  // Filter tasks based on activeTab, project, and search
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task || !task.id) return false;
      const matchesTab =
        viewMode === "board" ||
        activeTab === "All" ||
        (activeTab === "To Do" && task.status === "Pending") ||
        task.status === activeTab;
      const title = (task.title || "").toLowerCase();
      const desc = (task.description || "").toLowerCase();
      const projName = (task.projectName || "").toLowerCase();
      const q = (search || "").toLowerCase();
      const matchesSearch =
        !q || title.includes(q) || desc.includes(q) || projName.includes(q);
      return matchesTab && matchesSearch;
    });
  }, [tasks, activeTab, search, viewMode]);

  // Handle Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateTasks) {
      addToast(
        "Permission Denied",
        "You do not have permission to create tasks",
        "error",
      );
      return;
    }
    if (!createTitle.trim() || !createProjectId) return;

    try {
      setIsSubmitting(true);
      await api.post(`/projects/${createProjectId}/tasks`, {
        title: createTitle.trim(),
        description: createDesc.trim() || undefined,
        status: createStatus,
        priority: createPriority,
        dueDate: createDueDate
          ? new Date(createDueDate).toISOString()
          : undefined,
        assigneeIds:
          createAssigneeIds.length > 0 ? createAssigneeIds : undefined,
      });

      addToast(
        "Success",
        `Task "${createTitle}" created successfully`,
        "success",
      );
      setIsCreateModalOpen(false);
      setCreateTitle("");
      setCreateDesc("");
      setCreateAssigneeIds([]);
      fetchTasks();
    } catch (err: any) {
      addToast("Error", err.message || "Failed to create task", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Project Filter Change
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    if (projectId === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ projectId });
      setCreateProjectId(projectId);
    }
  };

  // Handle Edit Task
  const openEditModal = (task: Task) => {
    if (!canEditTasks) {
      addToast(
        "Permission Denied",
        "You do not have permission to edit tasks",
        "error",
      );
      return;
    }
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditStatus(task.status as TaskStatus);
    setEditPriority(task.priority || "Medium");
    setEditDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    setEditAssigneeIds((task.assignees || []).map((a) => a.id));
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditTasks) {
      addToast(
        "Permission Denied",
        "You do not have permission to edit tasks",
        "error",
      );
      return;
    }
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

      addToast("Success", "Task updated successfully", "success");
      setIsEditModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      addToast("Error", err.message || "Failed to update task", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Quick Change
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (!canEditTasks) {
      addToast(
        "Permission Denied",
        "You do not have permission to update task status",
        "error",
      );
      return;
    }
    const targetStatus = newStatus as TaskStatus;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)),
    );
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: targetStatus });
      addToast(
        "Status Updated",
        `Task moved to ${targetStatus === "Pending" ? "To Do" : targetStatus}`,
        "success",
      );
    } catch (err: any) {
      addToast("Error", err.message || "Failed to update task status", "error");
      fetchTasks();
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (id: string, title: string) => {
    if (!canDeleteTasks) {
      addToast(
        "Permission Denied",
        "You do not have permission to delete tasks",
        "error",
      );
      return;
    }
    if (
      window.confirm(`Are you sure you want to permanently delete "${title}"?`)
    ) {
      try {
        await api.delete(`/tasks/${id}`);
        setTasks((prev) => prev.filter((t) => t.id !== id));
        addToast("Task Deleted", `"${title}" has been removed`, "info");
      } catch (err: any) {
        addToast("Error", err.message || "Failed to delete task", "error");
      }
    }
  };

  // ============================================================================
  // MANDATORY DRAG-AND-DROP & TASK ORDERING REORDER LOGIC (Table View)
  // ============================================================================

  const persistReorderedTasks = async (
    targetProjectId: string,
    orderedTaskIds: string[],
  ) => {
    if (!canEditTasks) {
      addToast(
        "Permission Denied",
        "You do not have permission to reorder tasks",
        "error",
      );
      fetchTasks();
      return;
    }
    try {
      await api.patch(`/projects/${targetProjectId}/tasks/reorder`, {
        orderedTaskIds,
      });
      addToast(
        "Tasks Reordered",
        "New task order persisted to database",
        "success",
      );
    } catch (err: any) {
      addToast(
        "Reorder Error",
        err.message || "Could not save new task ordering",
        "error",
      );
      fetchTasks(); // Revert on failure
    }
  };

  // 1-Click Move Up / Move Down buttons for Accessibility
  const handleMoveTask = async (taskId: string, direction: "up" | "down") => {
    if (!canEditTasks) {
      addToast(
        "Permission Denied",
        "You do not have permission to reorder tasks",
        "error",
      );
      return;
    }
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const targetProjectId = task.projectId;
    const projectTasks = tasks.filter((t) => t.projectId === targetProjectId);
    const currentIndex = projectTasks.findIndex((t) => t.id === taskId);

    if (direction === "up" && currentIndex <= 0) return;
    if (direction === "down" && currentIndex >= projectTasks.length - 1) return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const reorderedProjectTasks = [...projectTasks];
    const [moved] = reorderedProjectTasks.splice(currentIndex, 1);
    reorderedProjectTasks.splice(targetIndex, 0, moved);

    const orderedTaskIds = reorderedProjectTasks.map((t) => t.id);

    // Optimistic UI update
    setTasks((prev) => {
      const otherTasks = prev.filter((t) => t.projectId !== targetProjectId);
      const updated = reorderedProjectTasks.map((t, idx) => ({
        ...t,
        orderIndex: idx + 1,
      }));
      return [...otherTasks, ...updated];
    });

    await persistReorderedTasks(targetProjectId, orderedTaskIds);
  };

  // Table Row Drag Events
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (!canEditTasks) {
      e.preventDefault();
      addToast(
        "Permission Denied",
        "You do not have permission to reorder tasks",
        "error",
      );
      return;
    }
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (draggedTaskId === targetTaskId) {
      setDragOverTaskId(null);
      setDragPosition(null);
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const position = offsetY < rect.height / 2 ? "above" : "below";

    setDragOverTaskId(targetTaskId);
    setDragPosition(position);
  };

  const handleDragLeave = () => {
    setDragOverTaskId(null);
    setDragPosition(null);
  };

  const handleDrop = async (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    const sourceTaskId = e.dataTransfer.getData("text/plain") || draggedTaskId;

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
        "Notice",
        "Reordering is scoped within the same project. Please filter by project or drag within the same project.",
        "info",
      );
      return;
    }

    const targetProjectId = targetTask.projectId;
    const projectTasks = tasks.filter((t) => t.projectId === targetProjectId);

    const oldIndex = projectTasks.findIndex((t) => t.id === sourceTaskId);
    let newIndex = projectTasks.findIndex((t) => t.id === targetTaskId);

    if (oldIndex === -1 || newIndex === -1) return;

    if (currentPosition === "below" && oldIndex < newIndex) {
      // dropping below a later item
    } else if (currentPosition === "above" && oldIndex > newIndex) {
      // dropping above an earlier item
    } else if (currentPosition === "below") {
      newIndex += 1;
    }

    const reorderedProjectTasks = [...projectTasks];
    const [moved] = reorderedProjectTasks.splice(oldIndex, 1);

    const insertAt = Math.min(
      Math.max(newIndex, 0),
      reorderedProjectTasks.length,
    );
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

    await persistReorderedTasks(targetProjectId, orderedTaskIds);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDragPosition(null);
    setDragOverColumn(null);
  };

  // ============================================================================
  // KANBAN BOARD DRAG-AND-DROP (Status Transition Between Columns)
  // ============================================================================

  const handleColumnDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleColumnDragLeave = (e: React.DragEvent) => {
    // Only clear if actually leaving this column container
    const currentTarget = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as Node | null;
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleColumnDrop = async (
    e: React.DragEvent,
    targetStatus: TaskStatus,
  ) => {
    e.preventDefault();
    if (!canEditTasks) {
      addToast(
        "Permission Denied",
        "You do not have permission to modify task status",
        "error",
      );
      return;
    }
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedTaskId(null);
    setDragOverColumn(null);

    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status === targetStatus) return; // Already in target status

    const previousStatus = task.status;

    // Optimistic UI state update: immediately move card to target column
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)),
    );

    try {
      await api.patch(`/tasks/${taskId}/status`, { status: targetStatus });
      addToast(
        "Status Changed",
        `"${task.title}" moved to ${targetStatus === "Pending" ? "To Do" : targetStatus}`,
        "success",
      );
    } catch (err: any) {
      addToast("Error", err.message || "Failed to update task status", "error");
      // Rollback on error
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: previousStatus } : t,
        ),
      );
    }
  };

  // Kanban Columns configuration
  const KANBAN_COLUMNS: {
    id: TaskStatus;
    title: string;
    color: string;
    badgeBg: string;
    badgeColor: string;
  }[] = [
    {
      id: "Pending",
      title: "To Do",
      color: "#f59e0b",
      badgeBg: "#fef3c7",
      badgeColor: "#b45309",
    },
    {
      id: "In Progress",
      title: "In Progress",
      color: "#6366f1",
      badgeBg: "#e0e7ff",
      badgeColor: "#4338ca",
    },
    {
      id: "Completed",
      title: "Completed",
      color: "#10b981",
      badgeBg: "#dcfce7",
      badgeColor: "#15803d",
    },
  ];

  if (!canViewTasks) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <div
          style={{
            maxWidth: "480px",
            margin: "40px auto",
            backgroundColor: "#ffffff",
            padding: "36px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "#fef2f2",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <AlertCircle size={24} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
            Access Denied
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.5 }}>
            You do not have permission to view tasks. Please contact your system administrator if you believe this is in error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>
            Tasks
          </h1>
          <p style={{ fontSize: "13.5px", color: "#64748b", marginTop: "2px" }}>
            Plan, reorder, and track tasks with list reordering and interactive
            Kanban board status transitions.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {/* View Mode Switcher (List vs Board) */}
          <div
            style={{
              display: "inline-flex",
              padding: "3px",
              borderRadius: "10px",
              backgroundColor: "#f1f5f9",
              border: "1px solid #e2e8f0",
            }}
          >
            <button
              onClick={() => handleViewModeChange("table")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                backgroundColor:
                  viewMode === "table" ? "#ffffff" : "transparent",
                color: viewMode === "table" ? "#0f172a" : "#64748b",
                boxShadow:
                  viewMode === "table" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
              title="Table / List View"
            >
              <LayoutList size={15} />
              <span>List</span>
            </button>

            <button
              onClick={() => handleViewModeChange("board")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                backgroundColor:
                  viewMode === "board" ? "#ffffff" : "transparent",
                color: viewMode === "board" ? "#0f172a" : "#64748b",
                boxShadow:
                  viewMode === "board" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
              title="Kanban Board View (Drag tasks between status columns)"
            >
              <Kanban size={15} />
              <span>Board</span>
            </button>
          </div>

          {/* Search Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "8px 14px",
              width: "240px",
            }}
          >
            <Search size={16} color="#94a3b8" style={{ marginRight: "8px" }} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                fontSize: "13.5px",
                width: "100%",
                color: "#0f172a",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={14} color="#94a3b8" />
              </button>
            )}
          </div>

          {canCreateTasks && (
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => {
                if (selectedProjectId !== "all") {
                  setCreateProjectId(selectedProjectId);
                }
                setIsCreateModalOpen(true);
              }}
            >
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* Read-Only Notice Banner */}
      {(!canEditTasks || !canCreateTasks) && (
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "12px 18px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#475569",
            fontSize: "13px",
          }}
        >
          <AlertCircle size={18} color="#64748b" />
          <span>
            {!canEditTasks && !canCreateTasks
              ? "You currently have read-only access to tasks. Editing and creation permissions have been restricted for your role."
              : !canEditTasks
              ? "Editing permissions have been restricted for your role. You cannot edit tasks, update status, or reorder."
              : "Task creation is disabled for your role."}
          </span>
        </div>
      )}

      {/* Task Summary Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "16px 20px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              backgroundColor: "#eef2ff",
              color: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div
              style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}
            >
              TOTAL TASKS
            </div>
            <div
              style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}
            >
              {stats.total}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "16px 20px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              backgroundColor: "#fef3c7",
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <div
              style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}
            >
              TO DO
            </div>
            <div
              style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}
            >
              {stats.pending}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "16px 20px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              backgroundColor: "#e0e7ff",
              color: "#4338ca",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertCircle size={20} />
          </div>
          <div>
            <div
              style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}
            >
              IN PROGRESS
            </div>
            <div
              style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}
            >
              {stats.inProgress}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "16px 20px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              backgroundColor: "#dcfce7",
              color: "#15803d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div
              style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}
            >
              COMPLETED
            </div>
            <div
              style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}
            >
              {stats.completed}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
          overflow: "hidden",
        }}
      >
        {/* Active Project Filter Notice Banner */}
        {selectedProjectId !== "all" && (
          <div
            style={{
              padding: "12px 24px",
              backgroundColor: "#eef2ff",
              borderBottom: "1px solid #e0e7ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "13px",
              color: "#3730a3",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span>Filtering tasks for:</span>
              <span
                style={{
                  fontWeight: 700,
                  backgroundColor: "#ffffff",
                  padding: "3px 10px",
                  borderRadius: "6px",
                  border: "1px solid #c7d2fe",
                  color: "#4338ca",
                }}
              >
                {projects.find((p) => p.id === selectedProjectId)?.name ||
                  "Selected Project"}
              </span>
              <span style={{ color: "#6366f1", fontSize: "12px" }}>
                {viewMode === "board"
                  ? "• Drag cards between columns to change status"
                  : "• Drag rows using grip handle or click arrows to reorder"}
              </span>
            </div>
            <button
              onClick={() => handleProjectSelect("all")}
              style={{
                background: "none",
                border: "none",
                color: "#4f46e5",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12.5px",
              }}
            >
              <X size={14} /> Clear Filter (View All Projects)
            </button>
          </div>
        )}

        {/* Filter Bar & Project Selector */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          {/* Filter Pills (active in table view) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {viewMode === "table" ? (
              [
                { label: "All", count: stats.total },
                { label: "To Do", count: stats.pending },
                { label: "In Progress", count: stats.inProgress },
                { label: "Completed", count: stats.completed },
              ].map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(tab.label as any)}
                  style={{
                    padding: "7px 18px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    backgroundColor:
                      activeTab === tab.label ? "#4f46e5" : "#f8fafc",
                    color: activeTab === tab.label ? "#ffffff" : "#475569",
                    border:
                      activeTab === tab.label ? "none" : "1px solid #e2e8f0",
                    transition: "all 0.15s ease",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      backgroundColor:
                        activeTab === tab.label
                          ? "rgba(255,255,255,0.25)"
                          : "#e2e8f0",
                      color: activeTab === tab.label ? "#ffffff" : "#475569",
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              ))
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "#64748b",
                }}
              >
                <Kanban size={16} color="#4f46e5" />
                <span style={{ fontWeight: 600, color: "#0f172a" }}>
                  Kanban Board
                </span>
                <span>
                  — Drag any card and drop into a column to update its status.
                </span>
              </div>
            )}
          </div>

          {/* Project Selector Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={15} color="#64748b" />
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectSelect(e.target.value)}
              style={{
                padding: "8px 14px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                fontSize: "13.5px",
                color: "#334155",
                outline: "none",
                fontWeight: 500,
                cursor: "pointer",
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

        {/* ============================================================================ */}
        {/* VIEW 1: TABLE / LIST VIEW                                                   */}
        {/* ============================================================================ */}
        {viewMode === "table" ? (
          <div style={{ overflowX: "auto" }}>
            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px",
                  color: "#64748b",
                  gap: "10px",
                }}
              >
                <Loader2 size={24} className="animate-spin" />
                <span>Loading tasks...</span>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div
                style={{
                  padding: "60px 20px",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#f1f5f9",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "12px",
                  }}
                >
                  <CheckCircle2 size={24} color="#94a3b8" />
                </div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#1e293b",
                  }}
                >
                  No tasks found
                </h3>
                <p style={{ fontSize: "13.5px", marginTop: "4px" }}>
                  {search
                    ? "No tasks match your search criteria"
                    : "Create your first task to get started"}
                </p>
              </div>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "13.5px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                      color: "#64748b",
                      fontWeight: 600,
                      fontSize: "12.5px",
                    }}
                  >
                    <th
                      style={{
                        padding: "14px 16px",
                        width: "56px",
                        textAlign: "center",
                      }}
                      title="Drag handle / Reorder"
                    >
                      <GripVertical
                        size={16}
                        color="#94a3b8"
                        style={{ display: "inline-block" }}
                      />
                    </th>
                    <th style={{ padding: "14px 16px", width: "45px" }}>#</th>
                    <th style={{ padding: "14px 20px", minWidth: "220px" }}>
                      Task Title
                    </th>
                    <th style={{ padding: "14px 16px" }}>Project</th>
                    <th style={{ padding: "14px 16px" }}>Assignees</th>
                    <th style={{ padding: "14px 16px" }}>Priority</th>
                    <th style={{ padding: "14px 16px" }}>Status</th>
                    <th style={{ padding: "14px 16px" }}>Due Date</th>
                    <th
                      style={{
                        padding: "14px 20px",
                        textAlign: "center",
                        width: "100px",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task, index) => {
                    const isBeingDragged = draggedTaskId === task.id;
                    const isDropTarget = dragOverTaskId === task.id;

                    const sameProjectTasks = tasks.filter(
                      (t) => t.projectId === task.projectId,
                    );
                    const projectIndex = sameProjectTasks.findIndex(
                      (t) => t.id === task.id,
                    );
                    const canMoveUp = projectIndex > 0;
                    const canMoveDown =
                      projectIndex < sameProjectTasks.length - 1;

                    return (
                      <tr
                        key={task.id}
                        draggable={canEditTasks}
                        onDragStart={canEditTasks ? (e) => handleDragStart(e, task.id) : undefined}
                        onDragOver={canEditTasks ? (e) => handleDragOver(e, task.id) : undefined}
                        onDragLeave={canEditTasks ? handleDragLeave : undefined}
                        onDrop={canEditTasks ? (e) => handleDrop(e, task.id) : undefined}
                        onDragEnd={canEditTasks ? handleDragEnd : undefined}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          cursor: canEditTasks ? "grab" : "default",
                          transition: "all 0.15s ease",
                          opacity: isBeingDragged ? 0.45 : 1,
                          backgroundColor: isBeingDragged
                            ? "#f1f5f9"
                            : "transparent",
                          boxShadow: isDropTarget
                            ? dragPosition === "above"
                              ? "inset 0 3px 0 0 #4f46e5"
                              : "inset 0 -3px 0 0 #4f46e5"
                            : "none",
                        }}
                        onMouseEnter={(e) => {
                          if (!isBeingDragged)
                            e.currentTarget.style.backgroundColor = "#fafafa";
                        }}
                        onMouseLeave={(e) => {
                          if (!isBeingDragged)
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                        }}
                      >
                        {/* Grip Handle and 1-Click Move Arrows */}
                        <td
                          style={{
                            padding: "14px 12px",
                            textAlign: "center",
                            color: "#94a3b8",
                          }}
                        >
                          {canEditTasks ? (
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <span
                                title="Drag to reorder"
                                style={{ cursor: "grab" }}
                              >
                                <GripVertical size={16} />
                              </span>
                              <div
                                style={{
                                  display: "inline-flex",
                                  flexDirection: "column",
                                }}
                              >
                                <button
                                  onClick={() => handleMoveTask(task.id, "up")}
                                  disabled={!canMoveUp}
                                  title="Move task up"
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: canMoveUp ? "pointer" : "default",
                                    opacity: canMoveUp ? 0.7 : 0.2,
                                    padding: 0,
                                    lineHeight: 1,
                                  }}
                                >
                                  <ChevronUp
                                    size={12}
                                    color={canMoveUp ? "#4f46e5" : "#94a3b8"}
                                  />
                                </button>
                                <button
                                  onClick={() => handleMoveTask(task.id, "down")}
                                  disabled={!canMoveDown}
                                  title="Move task down"
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: canMoveDown ? "pointer" : "default",
                                    opacity: canMoveDown ? 0.7 : 0.2,
                                    padding: 0,
                                    lineHeight: 1,
                                  }}
                                >
                                  <ChevronDown
                                    size={12}
                                    color={canMoveDown ? "#4f46e5" : "#94a3b8"}
                                  />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
                              #{index + 1}
                            </span>
                          )}
                        </td>

                        {/* Order Number */}
                        <td
                          style={{
                            padding: "14px 16px",
                            color: "#64748b",
                            fontSize: "12.5px",
                            fontWeight: 600,
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: "#f1f5f9",
                              color: "#475569",
                              minWidth: "22px",
                              textAlign: "center",
                            }}
                          >
                            {task.orderIndex || index + 1}
                          </span>
                        </td>

                        {/* Title & Description */}
                        <td
                          style={{
                            padding: "14px 20px",
                            fontWeight: 600,
                            color: "#0f172a",
                          }}
                        >
                          <div>{task.title}</div>
                          {task.description && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#64748b",
                                fontWeight: 400,
                                marginTop: "2px",
                                maxWidth: "360px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={task.description}
                            >
                              {task.description}
                            </div>
                          )}
                        </td>

                        {/* Project Name */}
                        <td style={{ padding: "14px 16px", color: "#475569" }}>
                          <span
                            style={{
                              padding: "3px 9px",
                              borderRadius: "6px",
                              backgroundColor: "#f1f5f9",
                              fontSize: "12px",
                              fontWeight: 500,
                              color: "#334155",
                            }}
                          >
                            {task.projectName || "Project"}
                          </span>
                        </td>

                        {/* Assignees */}
                        <td style={{ padding: "14px 16px" }}>
                          {task.assignees && task.assignees.length > 0 ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              {task.assignees.slice(0, 3).map((a) => (
                                <div
                                  key={a.id}
                                  title={`${a.fullName} (${a.email})`}
                                  style={{
                                    width: "26px",
                                    height: "26px",
                                    borderRadius: "50%",
                                    backgroundColor: "#4f46e5",
                                    color: "#ffffff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "10.5px",
                                    fontWeight: 700,
                                    border: "1.5px solid #ffffff",
                                  }}
                                >
                                  {a.fullName
                                    ? a.fullName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2)
                                    : "U"}
                                </div>
                              ))}
                              {task.assignees.length > 3 && (
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: "#64748b",
                                    fontWeight: 600,
                                  }}
                                >
                                  +{task.assignees.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span
                              style={{ fontSize: "12px", color: "#94a3b8" }}
                            >
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Priority */}
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              backgroundColor:
                                task.priority === "High"
                                  ? "#fee2e2"
                                  : task.priority === "Medium"
                                    ? "#fef3c7"
                                    : "#e0e7ff",
                              color:
                                task.priority === "High"
                                  ? "#b91c1c"
                                  : task.priority === "Medium"
                                    ? "#b45309"
                                    : "#4338ca",
                            }}
                          >
                            {task.priority || "Medium"}
                          </span>
                        </td>

                        {/* Status Dropdown / Badge */}
                        <td style={{ padding: "14px 16px" }}>
                          {canEditTasks ? (
                            <select
                              value={task.status}
                              onChange={(e) =>
                                handleStatusChange(task.id, e.target.value)
                              }
                              style={{
                                padding: "4px 10px",
                                borderRadius: "16px",
                                fontSize: "12px",
                                fontWeight: 700,
                                border: "none",
                                cursor: "pointer",
                                outline: "none",
                                backgroundColor:
                                  task.status === "Completed"
                                    ? "#dcfce7"
                                    : task.status === "In Progress"
                                      ? "#e0e7ff"
                                      : "#fef3c7",
                                color:
                                  task.status === "Completed"
                                    ? "#15803d"
                                    : task.status === "In Progress"
                                      ? "#4338ca"
                                      : "#b45309",
                              }}
                            >
                              <option value="Pending">Pending (To Do)</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          ) : (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: "16px",
                                fontSize: "12px",
                                fontWeight: 700,
                                backgroundColor:
                                  task.status === "Completed"
                                    ? "#dcfce7"
                                    : task.status === "In Progress"
                                      ? "#e0e7ff"
                                      : "#fef3c7",
                                color:
                                  task.status === "Completed"
                                    ? "#15803d"
                                    : task.status === "In Progress"
                                      ? "#4338ca"
                                      : "#b45309",
                              }}
                            >
                              {task.status === "Pending" ? "Pending (To Do)" : task.status}
                            </span>
                          )}
                        </td>

                        {/* Due Date */}
                        <td style={{ padding: "14px 16px", color: "#475569" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <Calendar size={14} color="#94a3b8" />
                            <span>
                              {task.dueDate
                                ? formatDateWithSetting(task.dueDate)
                                : "No due date"}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td
                          style={{ padding: "14px 20px", textAlign: "center" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                            }}
                          >
                            {canEditTasks && (
                              <button
                                onClick={() => openEditModal(task)}
                                style={{
                                  color: "#64748b",
                                  padding: "6px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  border: "none",
                                  background: "transparent",
                                }}
                                title="Edit Task"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            {canDeleteTasks && (
                              <button
                                onClick={() =>
                                  handleDeleteTask(task.id, task.title)
                                }
                                style={{
                                  color: "#ef4444",
                                  padding: "6px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  border: "none",
                                  background: "transparent",
                                }}
                                title="Delete Task"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            {!canEditTasks && !canDeleteTasks && (
                              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                                Read-only
                              </span>
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
        ) : (
          /* ============================================================================ */
          /* VIEW 2: KANBAN BOARD VIEW (Drag & Drop Between Status Columns)               */
          /* ============================================================================ */
          <div
            style={{
              padding: "24px",
              backgroundColor: "#f8fafc",
              minHeight: "620px",
            }}
          >
            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px",
                  color: "#64748b",
                  gap: "10px",
                }}
              >
                <Loader2 size={24} className="animate-spin" />
                <span>Loading board...</span>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
                  gap: "20px",
                  alignItems: "flex-start",
                }}
              >
                {KANBAN_COLUMNS.map((column) => {
                  const columnTasks = filteredTasks.filter(
                    (t) => t.status === column.id,
                  );
                  const isHovered = dragOverColumn === column.id;

                  return (
                    <div
                      key={column.id}
                      onDragOver={canEditTasks ? (e) => handleColumnDragOver(e, column.id) : undefined}
                      onDragLeave={canEditTasks ? handleColumnDragLeave : undefined}
                      onDrop={canEditTasks ? (e) => handleColumnDrop(e, column.id) : undefined}
                      style={{
                        backgroundColor: isHovered ? "#f0fdf4" : "#ffffff",
                        borderRadius: "14px",
                        border: isHovered
                          ? `2px dashed ${column.color}`
                          : "1px solid #e2e8f0",
                        padding: "16px",
                        minHeight: "520px",
                        display: "flex",
                        flexDirection: "column",
                        transition: "all 0.15s ease",
                        boxShadow: isHovered
                          ? "0 4px 12px rgba(79, 70, 229, 0.1)"
                          : "0 1px 3px rgba(15, 23, 42, 0.03)",
                      }}
                    >
                      {/* Column Header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "14px",
                          paddingBottom: "12px",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              width: "9px",
                              height: "9px",
                              borderRadius: "50%",
                              backgroundColor: column.color,
                              display: "inline-block",
                            }}
                          />
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 800,
                              color: "#0f172a",
                            }}
                          >
                            {column.title}
                          </span>
                        </div>

                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "12px",
                            backgroundColor: column.badgeBg,
                            color: column.badgeColor,
                            fontSize: "11.5px",
                            fontWeight: 700,
                          }}
                        >
                          {columnTasks.length}
                        </span>
                      </div>

                      {/* Drop Zone Placeholder hint when dragging */}
                      {isHovered && (
                        <div
                          style={{
                            padding: "12px",
                            borderRadius: "10px",
                            backgroundColor: column.badgeBg,
                            color: column.badgeColor,
                            fontSize: "12px",
                            fontWeight: 700,
                            textAlign: "center",
                            marginBottom: "12px",
                            border: `1.5px dashed ${column.color}`,
                          }}
                        >
                          + Drop here to move to {column.title}
                        </div>
                      )}

                      {/* Task Cards */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          flex: 1,
                        }}
                      >
                        {columnTasks.length === 0 && !isHovered ? (
                          <div
                            style={{
                              padding: "40px 16px",
                              textAlign: "center",
                              borderRadius: "10px",
                              border: "1.5px dashed #e2e8f0",
                              color: "#94a3b8",
                              fontSize: "12.5px",
                            }}
                          >
                            <div>No tasks in this column</div>
                            <div
                              style={{
                                fontSize: "11px",
                                marginTop: "4px",
                                color: "#cbd5e1",
                              }}
                            >
                              Drag a task card here to change status
                            </div>
                          </div>
                        ) : (
                          columnTasks.map((task) => {
                            const isBeingDragged = draggedTaskId === task.id;

                            return (
                              <div
                                key={task.id}
                                draggable={canEditTasks}
                                onDragStart={canEditTasks ? (e) => handleDragStart(e, task.id) : undefined}
                                onDragEnd={handleDragEnd}
                                style={{
                                  backgroundColor: "#ffffff",
                                  borderRadius: "10px",
                                  border: "1px solid #e2e8f0",
                                  padding: "14px",
                                  cursor: canEditTasks ? "grab" : "default",
                                  opacity: isBeingDragged ? 0.4 : 1,
                                  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                                  transition:
                                    "transform 0.12s ease, box-shadow 0.12s ease",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isBeingDragged) {
                                    e.currentTarget.style.transform =
                                      "translateY(-2px)";
                                    e.currentTarget.style.boxShadow =
                                      "0 4px 8px -2px rgba(15, 23, 42, 0.08)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isBeingDragged) {
                                    e.currentTarget.style.transform =
                                      "translateY(0)";
                                    e.currentTarget.style.boxShadow =
                                      "0 1px 3px rgba(15, 23, 42, 0.04)";
                                  }
                                }}
                              >
                                {/* Top Row: Project badge & Priority */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "8px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      padding: "2px 7px",
                                      borderRadius: "4px",
                                      backgroundColor: "#f1f5f9",
                                      color: "#475569",
                                    }}
                                  >
                                    {task.projectName || "Project"}
                                  </span>

                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "10.5px",
                                        fontWeight: 700,
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        backgroundColor:
                                          task.priority === "High"
                                            ? "#fee2e2"
                                            : task.priority === "Medium"
                                              ? "#fef3c7"
                                              : "#e0e7ff",
                                        color:
                                          task.priority === "High"
                                            ? "#b91c1c"
                                            : task.priority === "Medium"
                                              ? "#b45309"
                                              : "#4338ca",
                                      }}
                                    >
                                      {task.priority || "Medium"}
                                    </span>
                                    <GripVertical size={14} color="#94a3b8" />
                                  </div>
                                </div>

                                {/* Task Title */}
                                <div
                                  style={{
                                    fontSize: "13.5px",
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    marginBottom: "4px",
                                    lineHeight: 1.35,
                                  }}
                                >
                                  {task.title}
                                </div>

                                {/* Description */}
                                {task.description && (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#64748b",
                                      marginBottom: "10px",
                                      lineHeight: 1.4,
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                    }}
                                  >
                                    {task.description}
                                  </div>
                                )}

                                {/* Card Footer: Assignees, Due Date, Actions */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    paddingTop: "10px",
                                    borderTop: "1px solid #f8fafc",
                                  }}
                                >
                                  {/* Due Date */}
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      fontSize: "11px",
                                      color: "#64748b",
                                    }}
                                  >
                                    <Calendar size={12} color="#94a3b8" />
                                    <span>
                                      {task.dueDate
                                        ? formatDateWithSetting(task.dueDate)
                                        : "No due date"}
                                    </span>
                                  </div>

                                  {/* Assignee & Actions */}
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    {task.assignees &&
                                      task.assignees.length > 0 && (
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                          }}
                                        >
                                          {task.assignees
                                            .slice(0, 2)
                                            .map((a) => (
                                              <div
                                                key={a.id}
                                                title={a.fullName}
                                                style={{
                                                  width: "22px",
                                                  height: "22px",
                                                  borderRadius: "50%",
                                                  backgroundColor: "#4f46e5",
                                                  color: "#ffffff",
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                  fontSize: "9.5px",
                                                  fontWeight: 700,
                                                  border: "1.5px solid #ffffff",
                                                  marginLeft: "-4px",
                                                }}
                                              >
                                                {a.fullName
                                                  ? a.fullName
                                                      .split(" ")
                                                      .map((n) => n[0])
                                                      .join("")
                                                      .toUpperCase()
                                                      .slice(0, 2)
                                                  : "U"}
                                              </div>
                                            ))}
                                        </div>
                                      )}

                                    {canEditTasks && (
                                      <button
                                        onClick={() => openEditModal(task)}
                                        style={{
                                          color: "#64748b",
                                          padding: "4px",
                                          borderRadius: "4px",
                                          border: "none",
                                          background: "transparent",
                                          cursor: "pointer",
                                        }}
                                        title="Edit Task"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                    )}
                                    {canDeleteTasks && (
                                      <button
                                        onClick={() =>
                                          handleDeleteTask(task.id, task.title)
                                        }
                                        style={{
                                          color: "#ef4444",
                                          padding: "4px",
                                          borderRadius: "4px",
                                          border: "none",
                                          background: "transparent",
                                          cursor: "pointer",
                                        }}
                                        title="Delete Task"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================================ */}
      {/* MODAL: CREATE TASK                                                           */}
      {/* ============================================================================ */}
      <Modal
        isOpen={isCreateModalOpen && canCreateTasks}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Task"
        subtitle="Add a new task to an accessible project."
      >
        <form
          onSubmit={handleCreateTask}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <Input
            label="Task Title"
            required
            placeholder="e.g. Design Dashboard Components"
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
          />

          <div>
            <label
              style={{
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "6px",
                display: "block",
              }}
            >
              Description
            </label>
            <textarea
              placeholder="Task details and deliverables..."
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1.5px solid #e2e8f0",
                outline: "none",
                fontSize: "13.5px",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Project *
              </label>
              <select
                value={createProjectId}
                onChange={(e) => setCreateProjectId(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  outline: "none",
                  fontSize: "14px",
                  backgroundColor: "#ffffff",
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
              <label
                style={{
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Status *
              </label>
              <select
                value={createStatus}
                onChange={(e) => setCreateStatus(e.target.value as TaskStatus)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  outline: "none",
                  fontSize: "14px",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="Pending">Pending (To Do)</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Priority
              </label>
              <select
                value={createPriority}
                onChange={(e) => setCreatePriority(e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  outline: "none",
                  fontSize: "14px",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Due Date
              </label>
              <input
                type="date"
                value={createDueDate}
                onChange={(e) => setCreateDueDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  outline: "none",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {availableUsers.length > 0 && (
            <div>
              <label
                style={{
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Assignees
              </label>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  maxHeight: "120px",
                  overflowY: "auto",
                  padding: "8px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
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
                          setCreateAssigneeIds((prev) =>
                            prev.filter((id) => id !== u.id),
                          );
                        } else {
                          setCreateAssigneeIds((prev) => [...prev, u.id]);
                        }
                      }}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "16px",
                        fontSize: "12px",
                        fontWeight: 600,
                        backgroundColor: isSelected ? "#4f46e5" : "#f1f5f9",
                        color: isSelected ? "#ffffff" : "#334155",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
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

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================================ */}
      {/* MODAL: EDIT TASK                                                             */}
      {/* ============================================================================ */}
      <Modal
        isOpen={isEditModalOpen && canEditTasks}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Task"
        subtitle="Update task information, priority, and assignees."
      >
        <form
          onSubmit={handleUpdateTask}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <Input
            label="Task Title"
            required
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />

          <div>
            <label
              style={{
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "6px",
                display: "block",
              }}
            >
              Description
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1.5px solid #e2e8f0",
                outline: "none",
                fontSize: "13.5px",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  outline: "none",
                  fontSize: "14px",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="Pending">Pending (To Do)</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Priority
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  outline: "none",
                  fontSize: "14px",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "6px",
                display: "block",
              }}
            >
              Due Date
            </label>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1.5px solid #e2e8f0",
                outline: "none",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {availableUsers.length > 0 && (
            <div>
              <label
                style={{
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Assignees
              </label>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  maxHeight: "120px",
                  overflowY: "auto",
                  padding: "8px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
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
                          setEditAssigneeIds((prev) =>
                            prev.filter((id) => id !== u.id),
                          );
                        } else {
                          setEditAssigneeIds((prev) => [...prev, u.id]);
                        }
                      }}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "16px",
                        fontSize: "12px",
                        fontWeight: 600,
                        backgroundColor: isSelected ? "#4f46e5" : "#f1f5f9",
                        color: isSelected ? "#ffffff" : "#334155",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
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

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
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
