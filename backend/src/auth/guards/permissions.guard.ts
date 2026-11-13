import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import {
  PERMISSIONS_KEY,
  RequiredPermission,
} from '../../common/decorators/permissions.decorator';
import { DRIZZLE_PROVIDER } from '../../database/database.service';
import * as schema from '../../database/schema';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<RequiredPermission>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context not found');
    }

    // System administrator has universal access
    if (user.role === 'admin') {
      return true;
    }

    // Check dynamic granular role permission in database
    let [perm] = await this.db
      .select({
        canView: schema.rolePermissions.canView,
        canCreate: schema.rolePermissions.canCreate,
        canEdit: schema.rolePermissions.canEdit,
        canDelete: schema.rolePermissions.canDelete,
      })
      .from(schema.rolePermissions)
      .where(
        and(
          eq(schema.rolePermissions.roleId, user.role),
          eq(schema.rolePermissions.module, required.module),
        ),
      )
      .limit(1);

    if (!perm) {
      // Auto-ensure default permissions for this role in database if missing
      const modules = ['projects', 'tasks', 'user_management', 'permissions', 'settings', 'notifications'];
      const defaultEntries = modules.map((mod) => {
        let canView = false;
        let canCreate = false;
        let canEdit = false;
        let canDelete = false;

        if (user.role === 'project_manager') {
          canView = true;
          canCreate = mod === 'projects' || mod === 'tasks';
          canEdit = mod === 'projects' || mod === 'tasks';
        } else if (user.role === 'user' || user.role === 'member') {
          canView = mod === 'projects' || mod === 'tasks' || mod === 'notifications';
          canCreate = mod === 'tasks';
          canEdit = mod === 'tasks';
        } else if (user.role === 'viewer') {
          canView = mod === 'projects' || mod === 'tasks' || mod === 'notifications';
        }

        return {
          id: `${user.role}_${mod}`,
          roleId: user.role,
          module: mod,
          canView,
          canCreate,
          canEdit,
          canDelete,
        };
      });

      await this.db.insert(schema.rolePermissions).values(defaultEntries).onConflictDoNothing();

      const [refetched] = await this.db
        .select({
          canView: schema.rolePermissions.canView,
          canCreate: schema.rolePermissions.canCreate,
          canEdit: schema.rolePermissions.canEdit,
          canDelete: schema.rolePermissions.canDelete,
        })
        .from(schema.rolePermissions)
        .where(
          and(
            eq(schema.rolePermissions.roleId, user.role),
            eq(schema.rolePermissions.module, required.module),
          ),
        )
        .limit(1);

      perm = refetched;
    }

    const isAllowed = perm ? Boolean(perm[required.action]) : false;
    if (!isAllowed) {
      const readableAction = required.action
        .replace(/^can([A-Z])/, (_, c) => c.toLowerCase());
      throw new ForbiddenException(
        `Access denied. You do not have permission to ${readableAction} in module "${required.module}".`,
      );
    }

    return true;
  }
}
