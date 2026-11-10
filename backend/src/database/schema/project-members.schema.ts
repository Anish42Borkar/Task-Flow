import { pgTable, uuid, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { projects } from './projects.schema';

export const projectMembers = pgTable(
  'project_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_project_members_project_user').on(table.projectId, table.userId),
    index('idx_project_members_project_id').on(table.projectId),
    index('idx_project_members_user_id').on(table.userId),
  ],
);

export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;
