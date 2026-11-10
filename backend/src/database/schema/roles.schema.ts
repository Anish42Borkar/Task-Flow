import { pgTable, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id: varchar('id', { length: 50 }).primaryKey(), // 'admin', 'user', 'project_manager', 'member', 'viewer'
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isSystemRole: boolean('is_system_role').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const rolePermissions = pgTable('role_permissions', {
  id: varchar('id', { length: 100 }).primaryKey(), // composite or generated
  roleId: varchar('role_id', { length: 50 }).references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  module: varchar('module', { length: 50 }).notNull(), // 'projects', 'tasks', 'user_management', 'permissions', 'settings', 'notifications'
  canView: boolean('can_view').default(false).notNull(),
  canCreate: boolean('can_create').default(false).notNull(),
  canEdit: boolean('can_edit').default(false).notNull(),
  canDelete: boolean('can_delete').default(false).notNull(),
});
