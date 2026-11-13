import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, inArray, desc, asc, sql, and } from 'drizzle-orm';
import { DRIZZLE_PROVIDER } from '../database/database.service';
import * as schema from '../database/schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: NodePgDatabase<typeof schema>,
    private readonly eventsGateway: EventsGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async assertTaskPermission(
    actor: { id: string; role: string },
    projectId: string,
    action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete',
  ) {
    if (!actor) {
      throw new ForbiddenException('User context not found');
    }

    if (actor.role === 'admin') {
      return;
    }

    if (actor.role === 'viewer' && action !== 'canView') {
      throw new ForbiddenException(
        'Access denied. Viewers have read-only permissions and cannot modify tasks.',
      );
    }

    const [perm] = await this.db
      .select({
        canView: schema.rolePermissions.canView,
        canCreate: schema.rolePermissions.canCreate,
        canEdit: schema.rolePermissions.canEdit,
        canDelete: schema.rolePermissions.canDelete,
      })
      .from(schema.rolePermissions)
      .where(
        and(
          eq(schema.rolePermissions.roleId, actor.role),
          eq(schema.rolePermissions.module, 'tasks'),
        ),
      )
      .limit(1);

    if (!perm || !perm[action]) {
      const verb = action.replace(/^can([A-Z])/, (_, c) => c.toLowerCase());
      throw new ForbiddenException(
        `Access denied. You do not have permission to ${verb} tasks.`,
      );
    }

    if (projectId) {
      const [membership] = await this.db
        .select({ id: schema.projectMembers.id })
        .from(schema.projectMembers)
        .where(
          and(
            eq(schema.projectMembers.projectId, projectId),
            eq(schema.projectMembers.userId, actor.id),
          ),
        )
        .limit(1);

      if (!membership) {
        throw new ForbiddenException('Access denied. You are not a member of this project.');
      }
    }
  }

  async getAllTasksForUser(actor: { id: string; role: string }) {
    let projectIds: string[] = [];

    if (actor.role === 'admin') {
      const allProjects = await this.db.select({ id: schema.projects.id }).from(schema.projects);
      projectIds = allProjects.map((p) => p.id);
    } else {
      const [perm] = await this.db
        .select({ canView: schema.rolePermissions.canView })
        .from(schema.rolePermissions)
        .where(
          and(
            eq(schema.rolePermissions.roleId, actor.role),
            eq(schema.rolePermissions.module, 'tasks'),
          ),
        )
        .limit(1);

      if (perm && !perm.canView) {
        return [];
      }

      const memberships = await this.db
        .select({ projectId: schema.projectMembers.projectId })
        .from(schema.projectMembers)
        .where(eq(schema.projectMembers.userId, actor.id));
      projectIds = memberships.map((m) => m.projectId);
    }

    if (projectIds.length === 0) {
      return [];
    }

    const taskRows = await this.db
      .select({
        id: schema.tasks.id,
        title: schema.tasks.title,
        description: schema.tasks.description,
        status: schema.tasks.status,
        priority: schema.tasks.priority,
        orderIndex: schema.tasks.orderIndex,
        dueDate: schema.tasks.dueDate,
        projectId: schema.tasks.projectId,
        createdBy: schema.tasks.createdBy,
        createdAt: schema.tasks.createdAt,
        updatedAt: schema.tasks.updatedAt,
        projectName: schema.projects.name,
      })
      .from(schema.tasks)
      .innerJoin(schema.projects, eq(schema.tasks.projectId, schema.projects.id))
      .where(inArray(schema.tasks.projectId, projectIds))
      .orderBy(asc(schema.tasks.orderIndex));

    if (taskRows.length === 0) {
      return [];
    }

    const taskIds = taskRows.map((t) => t.id);

    // Fetch assignees
    const assignees = await this.db
      .select({
        taskId: schema.taskAssignees.taskId,
        userId: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        role: schema.users.roleId,
      })
      .from(schema.taskAssignees)
      .innerJoin(schema.users, eq(schema.taskAssignees.userId, schema.users.id))
      .where(inArray(schema.taskAssignees.taskId, taskIds));

    const assigneeMap = new Map<string, any[]>();
    for (const a of assignees) {
      const list = assigneeMap.get(a.taskId) || [];
      list.push({
        id: a.userId,
        fullName: a.fullName,
        email: a.email,
        role: a.role,
      });
      assigneeMap.set(a.taskId, list);
    }

    return taskRows.map((t) => ({
      ...t,
      assignees: assigneeMap.get(t.id) || [],
    }));
  }

  async getTasksByProject(projectId: string) {
    const [project] = await this.db
      .select({ name: schema.projects.name })
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    const taskRows = await this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.projectId, projectId))
      .orderBy(asc(schema.tasks.orderIndex));

    if (taskRows.length === 0) {
      return [];
    }

    const taskIds = taskRows.map((t) => t.id);

    // Fetch assignees for all tasks
    const assignees = await this.db
      .select({
        taskId: schema.taskAssignees.taskId,
        userId: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        role: schema.users.roleId,
      })
      .from(schema.taskAssignees)
      .innerJoin(schema.users, eq(schema.taskAssignees.userId, schema.users.id))
      .where(inArray(schema.taskAssignees.taskId, taskIds));

    const assigneeMap = new Map<string, any[]>();
    for (const a of assignees) {
      const list = assigneeMap.get(a.taskId) || [];
      list.push({
        id: a.userId,
        fullName: a.fullName,
        email: a.email,
        role: a.role,
      });
      assigneeMap.set(a.taskId, list);
    }

    return taskRows.map((t) => ({
      ...t,
      projectName: project?.name || 'Project',
      assignees: assigneeMap.get(t.id) || [],
    }));
  }

  async getTaskById(id: string) {
    const [task] = await this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.id, id))
      .limit(1);

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const assignees = await this.db
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        role: schema.users.roleId,
      })
      .from(schema.taskAssignees)
      .innerJoin(schema.users, eq(schema.taskAssignees.userId, schema.users.id))
      .where(eq(schema.taskAssignees.taskId, id));

    return {
      ...task,
      assignees,
    };
  }

  async createTask(projectId: string, dto: CreateTaskDto, actor: any) {
    await this.assertTaskPermission(actor, projectId, 'canCreate');

    // 1. Calculate next orderIndex
    const [maxOrderResult] = await this.db
      .select({ maxOrder: sql<number>`coalesce(max(${schema.tasks.orderIndex}), 0)` })
      .from(schema.tasks)
      .where(eq(schema.tasks.projectId, projectId));

    const nextOrder = Number(maxOrderResult?.maxOrder || 0) + 1.0;

    // 2. Insert Task
    const [task] = await this.db
      .insert(schema.tasks)
      .values({
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        projectId,
        status: dto.status || 'Pending',
        priority: dto.priority || 'Medium',
        orderIndex: nextOrder,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        createdBy: actor.id,
      })
      .returning();

    // 3. Insert Assignees if provided
    let assignedUsers: any[] = [];
    if (dto.assigneeIds && dto.assigneeIds.length > 0) {
      const assigneeRows = dto.assigneeIds.map((userId) => ({
        taskId: task.id,
        userId,
      }));
      await this.db.insert(schema.taskAssignees).values(assigneeRows).onConflictDoNothing();

      assignedUsers = await this.db
        .select({
          id: schema.users.id,
          fullName: schema.users.fullName,
          email: schema.users.email,
        })
        .from(schema.users)
        .where(inArray(schema.users.id, dto.assigneeIds));

      // Trigger notification for each assigned user
      for (const aUser of assignedUsers) {
        if (aUser.id !== actor.id) {
          await this.notificationsService.createNotification(
            aUser.id,
            'Task Assigned',
            `You have been assigned to task "${task.title}" by ${actor.fullName}.`,
            'task_assigned',
            task.id,
          );
        }
      }
    }

    const fullTask = { ...task, assignees: assignedUsers };

    // 4. Real-time broadcast to project room
    this.eventsGateway.broadcastToProject(projectId, 'task:created', {
      task: fullTask,
      projectId,
      actor: { id: actor.id, fullName: actor.fullName },
    });

    return fullTask;
  }

  async updateTask(id: string, dto: UpdateTaskDto, actor: any) {
    const [existing] = await this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    await this.assertTaskPermission(actor, existing.projectId, 'canEdit');

    const updatePayload: Partial<schema.Task> = { updatedAt: new Date() };
    if (dto.title) updatePayload.title = dto.title.trim();
    if (dto.description !== undefined) updatePayload.description = dto.description?.trim() || null;
    if (dto.status) updatePayload.status = dto.status;
    if (dto.priority) updatePayload.priority = dto.priority;
    if (dto.dueDate !== undefined) updatePayload.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    const [updatedTask] = await this.db
      .update(schema.tasks)
      .set(updatePayload)
      .where(eq(schema.tasks.id, id))
      .returning();

    // Query existing assignees prior to modification
    const existingAssignees = await this.db
      .select({ userId: schema.taskAssignees.userId })
      .from(schema.taskAssignees)
      .where(eq(schema.taskAssignees.taskId, id));
    const prevAssigneeIds = existingAssignees.map((a) => a.userId);

    let newlyAssignedIds: string[] = [];
    if (dto.assigneeIds) {
      newlyAssignedIds = dto.assigneeIds.filter((uid) => !prevAssigneeIds.includes(uid));

      // Remove existing
      await this.db.delete(schema.taskAssignees).where(eq(schema.taskAssignees.taskId, id));

      if (dto.assigneeIds.length > 0) {
        const rows = dto.assigneeIds.map((userId) => ({ taskId: id, userId }));
        await this.db.insert(schema.taskAssignees).values(rows).onConflictDoNothing();

        // Notify newly assigned users
        for (const userId of newlyAssignedIds) {
          if (userId !== actor.id) {
            await this.notificationsService.createNotification(
              userId,
              'Task Assigned',
              `You have been assigned to task "${updatedTask.title}" by ${actor.fullName}.`,
              'task_assigned',
              updatedTask.id,
            );
          }
        }
      }
    }

    // Determine current assignee IDs after update
    const currentAssigneeIds = dto.assigneeIds ? dto.assigneeIds : prevAssigneeIds;
    const statusChanged = dto.status && dto.status !== existing.status;

    // Notify other assignees and task creator about task update / status change
    const otherRecipients = new Set<string>();
    for (const uid of currentAssigneeIds) {
      if (uid !== actor.id && !newlyAssignedIds.includes(uid)) {
        otherRecipients.add(uid);
      }
    }
    if (existing.createdBy && existing.createdBy !== actor.id && !newlyAssignedIds.includes(existing.createdBy)) {
      otherRecipients.add(existing.createdBy);
    }

    for (const userId of otherRecipients) {
      if (statusChanged) {
        const notifTitle = dto.status === 'Completed' ? 'Task Completed' : 'Task Status Changed';
        const notifMsg = `Task "${updatedTask.title}" status changed to "${dto.status}" by ${actor.fullName}.`;
        const notifType = dto.status === 'Completed' ? 'task_completed' : 'task_updated';
        await this.notificationsService.createNotification(
          userId,
          notifTitle,
          notifMsg,
          notifType,
          updatedTask.id,
        );
      } else {
        await this.notificationsService.createNotification(
          userId,
          'Task Updated',
          `Task "${updatedTask.title}" was updated by ${actor.fullName}.`,
          'task_updated',
          updatedTask.id,
        );
      }
    }

    const fullTask = await this.getTaskById(id);

    // Real-time broadcast
    this.eventsGateway.broadcastToProject(existing.projectId, 'task:updated', {
      task: fullTask,
      projectId: existing.projectId,
      actor: { id: actor.id, fullName: actor.fullName },
    });

    return fullTask;
  }

  async updateStatus(id: string, status: string, actor: any) {
    const [existing] = await this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    await this.assertTaskPermission(actor, existing.projectId, 'canEdit');

    const [updated] = await this.db
      .update(schema.tasks)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.tasks.id, id))
      .returning();

    // Broadcast status change
    this.eventsGateway.broadcastToProject(existing.projectId, 'task:status_changed', {
      taskId: id,
      status,
      projectId: existing.projectId,
      actor: { id: actor.id, fullName: actor.fullName },
    });

    // Notify all assignees and task creator
    const assignees = await this.db
      .select({ userId: schema.taskAssignees.userId })
      .from(schema.taskAssignees)
      .where(eq(schema.taskAssignees.taskId, id));

    const recipients = new Set<string>();
    for (const a of assignees) {
      if (a.userId !== actor.id) recipients.add(a.userId);
    }
    if (existing.createdBy && existing.createdBy !== actor.id) {
      recipients.add(existing.createdBy);
    }

    const notifTitle = status === 'Completed' ? 'Task Completed' : 'Task Status Changed';
    const notifMsg = `Task "${existing.title}" status changed to "${status}" by ${actor.fullName}.`;
    const notifType = status === 'Completed' ? 'task_completed' : 'task_updated';

    for (const userId of recipients) {
      await this.notificationsService.createNotification(
        userId,
        notifTitle,
        notifMsg,
        notifType,
        updated.id,
      );
    }

    return updated;
  }

  async reorderTasks(projectId: string, orderedTaskIds: string[], actor: any) {
    if (!orderedTaskIds || orderedTaskIds.length === 0) {
      return { success: true, message: 'No tasks to reorder', orderedTaskIds: [] };
    }

    if (!projectId) {
      const [firstTask] = await this.db
        .select({ projectId: schema.tasks.projectId })
        .from(schema.tasks)
        .where(eq(schema.tasks.id, orderedTaskIds[0]))
        .limit(1);
      if (firstTask) {
        projectId = firstTask.projectId;
      }
    }

    await this.assertTaskPermission(actor, projectId, 'canEdit');

    // Persist new ordering by updating order_index for each task
    for (let index = 0; index < orderedTaskIds.length; index++) {
      const taskId = orderedTaskIds[index];
      await this.db
        .update(schema.tasks)
        .set({ orderIndex: index + 1.0, updatedAt: new Date() })
        .where(eq(schema.tasks.id, taskId));
    }

    // Broadcast reorder event to project room
    if (projectId) {
      this.eventsGateway.broadcastToProject(projectId, 'task:reordered', {
        projectId,
        orderedTaskIds,
        actor: { id: actor.id, fullName: actor.fullName },
      });
    }

    return { success: true, message: 'Tasks reordered successfully', orderedTaskIds };
  }

  async deleteTask(id: string, actor: any) {
    const [existing] = await this.db
      .select({ id: schema.tasks.id, projectId: schema.tasks.projectId })
      .from(schema.tasks)
      .where(eq(schema.tasks.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    await this.assertTaskPermission(actor, existing.projectId, 'canDelete');

    await this.db.delete(schema.tasks).where(eq(schema.tasks.id, id));

    // Broadcast delete event
    this.eventsGateway.broadcastToProject(existing.projectId, 'task:deleted', {
      taskId: id,
      projectId: existing.projectId,
      actor: { id: actor.id, fullName: actor.fullName },
    });

    return { success: true, message: `Task ${id} deleted` };
  }
}
