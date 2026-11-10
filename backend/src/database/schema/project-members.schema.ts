/**
 * ============================================================================
 * MANDATORY HAND-CODED COMPONENT: Database Design for Project Members
 * ============================================================================
 * INSTRUCTIONS FOR USER IMPLEMENTATION:
 * The assignment specification requires database design for projects and tasks
 * to be implemented manually.
 *
 * SPECIFICATION & REQUIREMENTS:
 * 1. Table Name: 'project_members'
 * 2. Columns to define using Drizzle ORM pg-core:
 *    - id: uuid primary key with default random
 *    - projectId: uuid referencing projects(id) on delete cascade not null
 *    - userId: uuid referencing users(id) on delete cascade not null
 *    - joinedAt: timestamp with timezone defaultNow not null
 * 3. Constraints:
 *    - Composite unique constraint on (projectId, userId) so a user cannot be
 *      added twice to the same project.
 *    - Index on (userId) and (projectId) for performant queries.
 * ============================================================================
 */

import { pgTable, uuid, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
// Import `projects` from './projects.schema' once defined

// TODO: [USER IMPLEMENTATION] Implement the `projectMembers` table using Drizzle ORM
// Example skeleton to complete:
// export const projectMembers = pgTable('project_members', {
//   ...
// });

// export type ProjectMember = typeof projectMembers.$inferSelect;
// export type NewProjectMember = typeof projectMembers.$inferInsert;
