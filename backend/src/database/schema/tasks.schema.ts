import { pgTable, uuid, varchar, text, doublePrecision, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { projects } from './projects.schema';

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    projectId: uuid('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    status: varchar('status', { length: 50 }).default('Pending').notNull(), // 'Pending', 'In Progress', 'Completed'
    orderIndex: doublePrecision('order_index').default(0).notNull(), // Drag-and-drop persistent ordering
    priority: varchar('priority', { length: 50 }).default('Medium').notNull(), // 'Low', 'Medium', 'High'
    dueDate: timestamp('due_date', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_tasks_project_order').on(table.projectId, table.status, table.orderIndex),
    index('idx_tasks_status').on(table.status),
    index('idx_tasks_project_id').on(table.projectId),
    index('idx_tasks_created_by').on(table.createdBy),
  ],
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
