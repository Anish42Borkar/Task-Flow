import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, inArray, desc, sql } from 'drizzle-orm';
import { DRIZZLE_PROVIDER } from '../database/database.service';
import * as schema from '../database/schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: NodePgDatabase<typeof schema>,
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

  async create(dto: CreateProjectDto, creatorId: string) {
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
    if (dto.memberIds && dto.memberIds.length > 0) {
      for (const mId of dto.memberIds) {
        if (mId !== creatorId) {
          membersToInsert.push({ projectId: project.id, userId: mId });
        }
      }
    }

    await this.db.insert(schema.projectMembers).values(membersToInsert).onConflictDoNothing();

    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
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

  async addMembers(projectId: string, userIds: string[]) {
    const records = userIds.map((userId) => ({ projectId, userId }));
    await this.db.insert(schema.projectMembers).values(records).onConflictDoNothing();
    return { success: true, message: 'Members added to project' };
  }

  async removeMember(projectId: string, userId: string) {
    await this.db
      .delete(schema.projectMembers)
      .where(
        sql`${schema.projectMembers.projectId} = ${projectId} AND ${schema.projectMembers.userId} = ${userId}`,
      );
    return { success: true, message: 'Member removed from project' };
  }
}
