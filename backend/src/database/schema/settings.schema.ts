import { pgTable, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const systemSettings = pgTable('system_settings', {
  id: varchar('id', { length: 50 }).primaryKey().default('default'),
  appName: varchar('app_name', { length: 100 }).notNull().default('TaskFlow'),
  theme: varchar('theme', { length: 50 }).notNull().default('Light'),
  timezone: varchar('timezone', { length: 100 }).notNull().default('(GMT+05:30) India Standard Time'),
  dateFormat: varchar('date_format', { length: 100 }).notNull().default('DD MMM, YYYY (e.g. 28 Oct, 2026)'),
  twoFactor: boolean('two_factor').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;
