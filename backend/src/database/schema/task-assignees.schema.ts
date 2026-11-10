/**
 * ============================================================================
 * MANDATORY HAND-CODED COMPONENT: Database Design for Task Assignees
 * ============================================================================
 * INSTRUCTIONS FOR USER IMPLEMENTATION:
 * The assignment specification requires database design for projects and tasks
 * to be implemented manually.
 *
 * SPECIFICATION & REQUIREMENTS:
 * 1. Table Name: 'task_assignees'
 * 2. Columns to define using Drizzle ORM pg-core:
 *    - id: uuid primary key with default random
 *    - taskId: uuid referencing tasks(id) on delete cascade not null
 *    - userId: uuid referencing users(id) on delete cascade not null
 *    - assignedAt: timestamp with timezone defaultNow not null
 * 3. Constraints:
 *    - Composite unique constraint on (taskId, userId)
 *    - Indices on (userId) and (taskId)
 * ============================================================================
 */

import { pgTable, uuid, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
// Import `tasks` from './tasks.schema' once defined

// TODO: [USER IMPLEMENTATION] Implement the `taskAssignees` table using Drizzle ORM
// Example skeleton to complete:
// export const taskAssignees = pgTable('task_assignees', {
//   ...
// });

// export type TaskAssignee = typeof taskAssignees.$inferSelect;
// export type NewTaskAssignee = typeof taskAssignees.$inferInsert;
