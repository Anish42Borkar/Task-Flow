/**
 * ============================================================================
 * MANDATORY HAND-CODED COMPONENT: Database Design for Projects
 * ============================================================================
 * INSTRUCTIONS FOR USER IMPLEMENTATION:
 * The assignment specification strictly requires that the database design for
 * projects and tasks be implemented manually without AI code generation.
 *
 * SPECIFICATION & REQUIREMENTS:
 * 1. Table Name: 'projects'
 * 2. Columns to define using Drizzle ORM pg-core:
 *    - id: uuid primary key with default random (uuid('id').defaultRandom().primaryKey())
 *    - name: varchar(200) not null
 *    - description: text
 *    - status: varchar(50) default 'active' not null ('active', 'in_progress', 'completed', 'on_hold')
 *    - dueDate: timestamp with timezone
 *    - createdBy: uuid referencing users(id) on delete set null
 *    - createdAt: timestamp with timezone defaultNow not null
 *    - updatedAt: timestamp with timezone defaultNow not null
 * 3. Relations:
 *    - A project has many project_members
 *    - A project has many tasks
 *    - A project belongs to a creator (users)
 *
 * VALIDATION & ACCEPTANCE CRITERIA:
 * - Proper foreign key reference to `users.id`
 * - Cascade behavior correctly handles deletion
 * - Exported as `projects` and type inferred `typeof projects.$inferSelect`
 * ============================================================================
 */

import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

// TODO: [USER IMPLEMENTATION] Implement the `projects` table using Drizzle ORM
// Example skeleton to complete:
// export const projects = pgTable('projects', {
//   ...
// });

// export type Project = typeof projects.$inferSelect;
// export type NewProject = typeof projects.$inferInsert;
