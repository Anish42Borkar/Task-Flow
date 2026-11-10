/**
 * ============================================================================
 * MANDATORY HAND-CODED COMPONENT: Database Design for Tasks
 * ============================================================================
 * INSTRUCTIONS FOR USER IMPLEMENTATION:
 * The assignment specification strictly requires that the database design for
 * projects and tasks be implemented manually without AI code generation.
 *
 * SPECIFICATION & REQUIREMENTS:
 * 1. Table Name: 'tasks'
 * 2. Columns to define using Drizzle ORM pg-core:
 *    - id: uuid primary key with default random
 *    - title: varchar(255) not null
 *    - description: text
 *    - projectId: uuid referencing projects(id) on delete cascade not null
 *    - status: varchar(50) default 'Pending' not null ('Pending', 'In Progress', 'Completed')
 *    - orderIndex: doublePrecision('order_index').default(0).notNull() (Used for DnD persistent ordering)
 *    - priority: varchar(50) default 'Medium' not null ('Low', 'Medium', 'High')
 *    - dueDate: timestamp with timezone
 *    - createdBy: uuid referencing users(id) on delete set null
 *    - createdAt: timestamp with timezone defaultNow not null
 *    - updatedAt: timestamp with timezone defaultNow not null
 * 3. Indices:
 *    - Compound index on (projectId, status, orderIndex) for instant ordering queries.
 *    - Index on (status).
 * ============================================================================
 */

import { pgTable, uuid, varchar, text, doublePrecision, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
// Import `projects` from './projects.schema' once defined

// TODO: [USER IMPLEMENTATION] Implement the `tasks` table using Drizzle ORM
// Example skeleton to complete:
// export const tasks = pgTable('tasks', {
//   ...
// });

// export type Task = typeof tasks.$inferSelect;
// export type NewTask = typeof tasks.$inferInsert;
