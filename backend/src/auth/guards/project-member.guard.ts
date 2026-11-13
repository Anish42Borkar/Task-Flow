import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE_PROVIDER } from '../../database/database.service';
import * as schema from '../../database/schema';

@Injectable()
export class ProjectMemberGuard implements CanActivate {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context not found');
    }

    // Admins have organization-wide access
    if (user.role === 'admin') {
      return true;
    }

    let projectId = request.params.projectId || request.body.projectId || request.query.projectId;

    // If param is 'id' on a project route:
    const routePath = request.route?.path || '';
    if (!projectId && routePath.includes('projects') && request.params.id) {
      projectId = request.params.id;
    }

    // If param is 'id' or 'taskId' on a task route, lookup task's project
    const taskId = request.params.taskId || (routePath.includes('tasks') ? request.params.id : null);
    if (!projectId && taskId) {
      const [task] = await this.db
        .select({ projectId: schema.tasks.projectId })
        .from(schema.tasks)
        .where(eq(schema.tasks.id, taskId))
        .limit(1);

      if (!task) {
        throw new NotFoundException(`Task with ID ${taskId} not found`);
      }
      projectId = task.projectId;
    }

    // If reordering tasks where projectId was not directly in params or body
    if (!projectId && Array.isArray(request.body?.orderedTaskIds) && request.body.orderedTaskIds.length > 0) {
      const firstTaskId = request.body.orderedTaskIds[0];
      const [task] = await this.db
        .select({ projectId: schema.tasks.projectId })
        .from(schema.tasks)
        .where(eq(schema.tasks.id, firstTaskId))
        .limit(1);

      if (task) {
        projectId = task.projectId;
      }
    }

    if (!projectId) {
      return true;
    }

    // Check project membership or creator in database
    const [membership] = await this.db
      .select({ id: schema.projectMembers.id })
      .from(schema.projectMembers)
      .where(
        and(
          eq(schema.projectMembers.projectId, projectId),
          eq(schema.projectMembers.userId, user.id),
        ),
      )
      .limit(1);

    if (membership) {
      return true;
    }

    const [project] = await this.db
      .select({ createdBy: schema.projects.createdBy })
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (project?.createdBy === user.id) {
      return true;
    }

    throw new ForbiddenException('Access denied. You are not a member of this project.');
  }
}
