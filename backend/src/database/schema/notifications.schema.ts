import { pgTable, uuid, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    message: text('message').notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 'task_assigned', 'task_updated', 'task_completed', 'task_reordered', 'project_updated'
    referenceId: uuid('reference_id'),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_notifications_user_read').on(table.userId, table.isRead, table.createdAt),
  ],
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

