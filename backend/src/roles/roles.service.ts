import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql } from 'drizzle-orm';
import { DRIZZLE_PROVIDER } from '../database/database.service';
import * as schema from '../database/schema';

export interface UpdateRolePermissionInput {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

@Injectable()
export class RolesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    const rolesList = await this.db.select().from(schema.roles);

    const counts = await this.db
      .select({
        roleId: schema.users.roleId,
        count: sql<number>`count(*)`,
      })
      .from(schema.users)
      .groupBy(schema.users.roleId);

    const countMap = new Map<string, number>();
    counts.forEach((c) => countMap.set(c.roleId, Number(c.count)));

    return rolesList.map((r) => ({
      ...r,
      usersCount: countMap.get(r.id) || 0,
      createdOn: new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    }));
  }

  async createRole(name: string, description?: string) {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const [created] = await this.db
      .insert(schema.roles)
      .values({
        id,
        name: name.trim(),
        description: description?.trim() || null,
        isSystemRole: false,
      })
      .returning();

    // Initialize default permissions for the new role
    const modules = ['projects', 'tasks', 'user_management', 'permissions', 'settings', 'notifications'];
    const permissionEntries: schema.NewRolePermission[] = modules.map((mod) => ({
      id: `${id}_${mod}`,
      roleId: id,
      module: mod,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    }));

    await this.db.insert(schema.rolePermissions).values(permissionEntries).onConflictDoNothing();

    return created;
  }

  async getRolePermissions(roleId: string) {
    const [role] = await this.db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.id, roleId))
      .limit(1);

    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    const modules = ['projects', 'tasks', 'user_management', 'permissions', 'settings', 'notifications'];
    let permissions = await this.db
      .select()
      .from(schema.rolePermissions)
      .where(eq(schema.rolePermissions.roleId, roleId));

    // If any modules are missing for this role, auto-initialize them
    if (permissions.length < modules.length) {
      const existingModules = new Set(permissions.map((p) => p.module));
      const missing = modules.filter((m) => !existingModules.has(m));

      const newEntries: schema.NewRolePermission[] = missing.map((mod) => {
        let canView = false;
        let canCreate = false;
        let canEdit = false;
        let canDelete = false;

        if (roleId === 'project_manager') {
          canView = true;
          canCreate = mod === 'projects' || mod === 'tasks';
          canEdit = mod === 'projects' || mod === 'tasks';
        } else if (roleId === 'viewer') {
          canView = mod === 'projects' || mod === 'tasks' || mod === 'notifications';
        }

        return {
          id: `${roleId}_${mod}`,
          roleId,
          module: mod,
          canView,
          canCreate,
          canEdit,
          canDelete,
        };
      });

      if (newEntries.length > 0) {
        await this.db.insert(schema.rolePermissions).values(newEntries).onConflictDoNothing();
        permissions = await this.db
          .select()
          .from(schema.rolePermissions)
          .where(eq(schema.rolePermissions.roleId, roleId));
      }
    }

    return { role, permissions };
  }

  async updateRolePermissions(roleId: string, items: UpdateRolePermissionInput[]) {
    for (const item of items) {
      await this.db
        .insert(schema.rolePermissions)
        .values({
          id: `${roleId}_${item.module}`,
          roleId,
          module: item.module,
          canView: item.canView,
          canCreate: item.canCreate,
          canEdit: item.canEdit,
          canDelete: item.canDelete,
        })
        .onConflictDoUpdate({
          target: schema.rolePermissions.id,
          set: {
            canView: item.canView,
            canCreate: item.canCreate,
            canEdit: item.canEdit,
            canDelete: item.canDelete,
          },
        });
    }

    return { success: true, message: `Permissions updated for role ${roleId}` };
  }
}
