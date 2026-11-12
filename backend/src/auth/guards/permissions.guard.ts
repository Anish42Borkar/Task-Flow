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

    // Explicit check: Viewers are strictly read-only and cannot mutate any resource
    if (user.role === 'viewer' && required.action !== 'canView') {
      throw new ForbiddenException(
        `Access denied. Users with the Viewer role cannot modify or create ${required.module}.`,
      );
    }

    // Check dynamic granular role permission in database
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
          eq(schema.rolePermissions.roleId, user.role),
          eq(schema.rolePermissions.module, required.module),
        ),
      )
      .limit(1);

    if (!perm) {
      throw new ForbiddenException(
        `Access denied. No permissions configured for role "${user.role}" in module "${required.module}".`,
      );
    }

    const isAllowed = Boolean(perm[required.action]);
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
