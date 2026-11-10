import { pgTable, uuid, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { tasks } from './tasks.schema';

export const taskAssignees = pgTable(
  'task_assignees',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    taskId: uuid('task_id')
      .references(() => tasks.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_task_assignees_task_user').on(table.taskId, table.userId),
    index('idx_task_assignees_task_id').on(table.taskId),
    index('idx_task_assignees_user_id').on(table.userId),
  ],
);

export type TaskAssignee = typeof taskAssignees.$inferSelect;
export type NewTaskAssignee = typeof taskAssignees.$inferInsert;
