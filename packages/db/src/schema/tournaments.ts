import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';

export const tournaments = pgTable(
  'tournaments',
  {
    id: uuid().primaryKey().defaultRandom(),
    creatorId: uuid().references(() => users.id, {
      onDelete: 'set null',
    }),
    title: text().notNull(),
    slug: text().unique().notNull(),
    description: text(),
    category: text().notNull(),
    size: integer().notNull(),
    totalRounds: integer().notNull(),
    status: text().notNull().default('draft'),
    matchupDurationHours: integer().notNull().default(24),
    championSubmissionId: uuid(),
    championUserId: uuid().references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    check('size_check', sql`${table.size} IN (8, 16, 32, 64)`),
    // We use this since postgres enums are painful to migrate
    check(
      'status_check',
      sql`${table.status} IN ('draft', 'accepting_submissions', 'in_progress', 'completed', 'cancelled')`,
    ),
    index('idx_tournaments_search').using(
      'gin',
      sql`(
        setweight(to_tsvector('english', coalesce(${table.title}, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(${table.description}, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(${table.category}, '')), 'C')
      )`,
    ),
  ],
);
