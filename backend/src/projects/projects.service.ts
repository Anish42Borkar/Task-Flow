import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, inArray, desc, sql, and } from 'drizzle-orm';
import { DRIZZLE_PROVIDER } from '../database/database.service';
import * as schema from '../database/schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: NodePgDatabase<typeof schema>,
    private readonly notificationsService: NotificationsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async findAll(userId: string, role: string) {
    let projectList: schema.Project[] = [];

    if (role === 'admin') {
      projectList = await this.db
        .select()
        .from(schema.projects)
        .orderBy(desc(schema.projects.createdAt));
    } else {
      // Find project IDs where user is member
      const memberships = await this.db
        .select({ projectId: schema.projectMembers.projectId })
        .from(schema.projectMembers)
        .where(eq(schema.projectMembers.userId, userId));

      const projectIds = memberships.map((m) => m.projectId);
      if (projectIds.length === 0) {
        return [];
      }

      projectList = await this.db
        .select()
        .from(schema.projects)
        .where(inArray(schema.projects.id, projectIds))
        .orderBy(desc(schema.projects.createdAt));
    }

    // Enrich projects with task stats and member lists
    const enriched = await Promise.all(
      projectList.map(async (project) => {
        // Task statistics
        const [stats] = await this.db
          .select({
            totalTasks: sql<number>`count(*)`,
            completedTasks: sql<number>`count(*) filter (where ${schema.tasks.status} = 'Completed')`,
          })
          .from(schema.tasks)
          .where(eq(schema.tasks.projectId, project.id));

        const total = Number(stats?.totalTasks || 0);
        const completed = Number(stats?.completedTasks || 0);
        const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Project members
        const membersData = await this.db
          .select({
            id: schema.users.id,
            fullName: schema.users.fullName,
            email: schema.users.email,
            role: schema.users.roleId,
          })
          .from(schema.projectMembers)
          .innerJoin(schema.users, eq(schema.projectMembers.userId, schema.users.id))
          .where(eq(schema.projectMembers.projectId, project.id));

        return {
          ...project,
          tasksCount: total,
          completedTasksCount: completed,
          progressPercentage,
          members: membersData,
        };
      }),
    );

    return enriched;
  }

  async findOne(id: string, userId: string, role: string) {
    if (role !== 'admin') {
      const [isMember] = await this.db
        .select({ id: schema.projectMembers.id })
        .from(schema.projectMembers)
        .where(
          sql`${schema.projectMembers.projectId} = ${id} AND ${schema.projectMembers.userId} = ${userId}`,
        )
        .limit(1);

      if (!isMember) {
        throw new ForbiddenException('You do not have access to this project');
      }
    }

    const [project] = await this.db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, id))
      .limit(1);

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const members = await this.db
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        role: schema.users.roleId,
      })
      .from(schema.projectMembers)
      .innerJoin(schema.users, eq(schema.projectMembers.userId, schema.users.id))
      .where(eq(schema.projectMembers.projectId, id));

    const projectTasks = await this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.projectId, id))
      .orderBy(schema.tasks.orderIndex);

    return {
      ...project,
      members,
      tasks: projectTasks,
    };
  }

  async create(dto: CreateProjectDto, creatorId: string, actor?: any) {
    const [project] = await this.db
      .insert(schema.projects)
      .values({
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        status: dto.status || 'active',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        createdBy: creatorId,
      })
      .returning();

    // Add creator to project members
    const membersToInsert = [{ projectId: project.id, userId: creatorId }];

    // Add requested members
    const assignedUserIds: string[] = [];
    if (dto.memberIds && dto.memberIds.length > 0) {
      for (const mId of dto.memberIds) {
        if (mId !== creatorId) {
          membersToInsert.push({ projectId: project.id, userId: mId });
          assignedUserIds.push(mId);
        }
      }
    }

    await this.db.insert(schema.projectMembers).values(membersToInsert).onConflictDoNothing();

    // Notify newly assigned members
    const actorName = actor?.fullName || 'Project Admin';
    for (const userId of assignedUserIds) {
      try {
        const notif = await this.notificationsService.createNotification(
          userId,
          'Assigned to Project',
          `You have been added to the project "${project.name}" by ${actorName}.`,
          'project_assigned',
          project.id,
        );
        this.eventsGateway.sendToUser(userId, 'project:assigned', {
          projectId: project.id,
          projectName: project.name,
          title: 'Assigned to Project',
          message: `You have been added to the project "${project.name}" by ${actorName}.`,
          notification: notif,
        });
      } catch (e) {
        console.warn(`Failed to dispatch assignment notification to user ${userId}`, e);
      }
    }

    if (assignedUserIds.length > 0 && creatorId) {
      try {
        await this.notificationsService.createNotification(
          creatorId,
          'Project Workspace Created',
          `Created project "${project.name}" with ${assignedUserIds.length} assigned member(s).`,
          'project_updated',
          project.id,
        );
      } catch (e) {
        // ignore
      }
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto, actor?: any) {
    const updatePayload: Partial<schema.Project> = { updatedAt: new Date() };
    if (dto.name) updatePayload.name = dto.name.trim();
    if (dto.description !== undefined) updatePayload.description = dto.description?.trim() || null;
    if (dto.status) updatePayload.status = dto.status;
    if (dto.dueDate !== undefined) updatePayload.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    const [updated] = await this.db
      .update(schema.projects)
      .set(updatePayload)
      .where(eq(schema.projects.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    // If memberIds are provided, synchronize project members
    if (dto.memberIds !== undefined) {
      await this.setMembers(id, dto.memberIds, actor);
    }

    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(schema.projects)
      .where(eq(schema.projects.id, id))
      .returning({ id: schema.projects.id });

    if (!deleted) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return { success: true, message: `Project ${id} removed` };
  }

  async addMembers(projectId: string, userIds: string[], actor?: any) {
    const [project] = await this.db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Find current member IDs
    const currentMembers = await this.db
      .select({ userId: schema.projectMembers.userId })
      .from(schema.projectMembers)
      .where(eq(schema.projectMembers.projectId, projectId));
    const currentMemberIds = new Set(currentMembers.map((m) => m.userId));

    const newMemberIds = userIds.filter((uid) => !currentMemberIds.has(uid));
    if (newMemberIds.length > 0) {
      const records = newMemberIds.map((userId) => ({ projectId, userId }));
      await this.db.insert(schema.projectMembers).values(records).onConflictDoNothing();

      const actorName = actor?.fullName || 'Project Admin';
      const assignedUsers = await this.db
        .select({ id: schema.users.id, fullName: schema.users.fullName })
        .from(schema.users)
        .where(inArray(schema.users.id, newMemberIds));
      const userNames = assignedUsers.map((u) => u.fullName).join(', ');

      for (const u of assignedUsers) {
        try {
          const notif = await this.notificationsService.createNotification(
            u.id,
            'Assigned to Project',
            `You have been added to the project "${project.name}" by ${actorName}.`,
            'project_assigned',
            projectId,
          );
          this.eventsGateway.sendToUser(u.id, 'project:assigned', {
            projectId,
            projectName: project.name,
            title: 'Assigned to Project',
            message: `You have been added to the project "${project.name}" by ${actorName}.`,
            notification: notif,
          });
        } catch (e) {
          console.warn(`Failed to dispatch assignment notification to user ${u.id}`, e);
        }
      }

      if (actor && actor.id) {
        try {
          await this.notificationsService.createNotification(
            actor.id,
            'Team Member Assigned',
            `You assigned ${userNames || 'team member'} to project "${project.name}".`,
            'project_assigned',
            projectId,
          );
        } catch (e) {
          console.warn(`Failed to dispatch notification to actor ${actor.id}`, e);
        }
      }
    }

    // Return refreshed members
    const members = await this.db
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        role: schema.users.roleId,
      })
      .from(schema.projectMembers)
      .innerJoin(schema.users, eq(schema.projectMembers.userId, schema.users.id))
      .where(eq(schema.projectMembers.projectId, projectId));

    return { success: true, message: 'Members added to project', members };
  }

  async setMembers(projectId: string, userIds: string[], actor?: any) {
    const [project] = await this.db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Current members
    const currentMembers = await this.db
      .select({ userId: schema.projectMembers.userId })
      .from(schema.projectMembers)
      .where(eq(schema.projectMembers.projectId, projectId));
    const currentMemberIds = new Set(currentMembers.map((m) => m.userId));

    // Ensure creator remains a member
    const targetUserIds = new Set(userIds);
    if (project.createdBy) {
      targetUserIds.add(project.createdBy);
    }

    // Members to remove
    const toRemove = currentMembers
      .map((m) => m.userId)
      .filter((uid) => !targetUserIds.has(uid) && uid !== project.createdBy);

    if (toRemove.length > 0) {
      await this.db
        .delete(schema.projectMembers)
        .where(
          and(
            eq(schema.projectMembers.projectId, projectId),
            inArray(schema.projectMembers.userId, toRemove),
          ),
        );
    }

    // Members to add
    const toAdd = Array.from(targetUserIds).filter((uid) => !currentMemberIds.has(uid));
    if (toAdd.length > 0) {
      const records = toAdd.map((userId) => ({ projectId, userId }));
      await this.db.insert(schema.projectMembers).values(records).onConflictDoNothing();

      const actorName = actor?.fullName || 'Project Admin';
      for (const userId of toAdd) {
        if (!actor || userId !== actor.id) {
          try {
            const notif = await this.notificationsService.createNotification(
              userId,
              'Assigned to Project',
              `You have been added to the project "${project.name}" by ${actorName}.`,
              'project_assigned',
              projectId,
            );
            this.eventsGateway.sendToUser(userId, 'project:assigned', {
              projectId,
              projectName: project.name,
              title: 'Assigned to Project',
              message: `You have been added to the project "${project.name}" by ${actorName}.`,
              notification: notif,
            });
          } catch (e) {
            console.warn(`Failed to dispatch assignment notification to user ${userId}`, e);
          }
        }
      }
      if (actor && actor.id) {
        try {
          const assignedUsers = await this.db
            .select({ id: schema.users.id, fullName: schema.users.fullName })
            .from(schema.users)
            .where(inArray(schema.users.id, toAdd));
          const userNames = assignedUsers.map((u) => u.fullName).join(', ');
          await this.notificationsService.createNotification(
            actor.id,
            'Team Member Assigned',
            `You assigned ${userNames || 'team member'} to project "${project.name}".`,
            'project_assigned',
            projectId,
          );
        } catch (e) {
          console.warn(`Failed to dispatch notification to actor ${actor.id}`, e);
        }
      }
    }

    // Return refreshed members
    const members = await this.db
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        role: schema.users.roleId,
      })
      .from(schema.projectMembers)
      .innerJoin(schema.users, eq(schema.projectMembers.userId, schema.users.id))
      .where(eq(schema.projectMembers.projectId, projectId));

    return { success: true, message: 'Project members updated successfully', members };
  }

  async removeMember(projectId: string, userId: string, actor?: any) {
    await this.db
      .delete(schema.projectMembers)
      .where(
        sql`${schema.projectMembers.projectId} = ${projectId} AND ${schema.projectMembers.userId} = ${userId}`,
      );

    try {
      this.eventsGateway.sendToUser(userId, 'project:removed', { projectId });
    } catch (e) {
      // ignore
    }

    return { success: true, message: 'Member removed from project' };
  }
}
