import {
  boolean,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { tournaments } from './tournaments';
import { submissions } from './submissions';
import { sql } from 'drizzle-orm';

export const matchups = pgTable(
  'matchups',
  {
    id: uuid().primaryKey().defaultRandom(),
    tournamentId: uuid()
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    round: integer().notNull(),
    position: integer().notNull(),

    entryAId: uuid().references(() => submissions.id, { onDelete: 'set null' }),
    entryBId: uuid().references(() => submissions.id, { onDelete: 'set null' }),
    seedA: integer(),
    seedB: integer(),
    winnerId: uuid().references(() => submissions.id, { onDelete: 'set null' }),

    votesA: integer().notNull().default(0),
    votesB: integer().notNull().default(0),

    isBye: boolean().notNull().default(false),
    status: text().notNull().default('pending'),
    // when voting opens
    activatesAt: timestamp({ withTimezone: true }),
    // when voting closes
    closesAt: timestamp({ withTimezone: true }),
    // when the winner was determined
    resolvedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    unique('tournament_round_position').on(
      table.tournamentId,
      table.round,
      table.position,
    ),
    check(
      'status_check',
      sql`${table.status} IN ('pending', 'active', 'completed', 'bye', 'cancelled')`,
    ),
    // an active matchup MUST have a closing time
    check(
      'active_closesAt_check',
      sql`${table.status} != 'active' OR ${table.closesAt} IS NOT NULL`,
    ),
    // an active matchup MUST have an activation time
    check(
      'active_activatesAt_check',
      sql`${table.status} != 'active' OR ${table.activatesAt} IS NOT NULL`,
    ),

    // an active matchup can't be a bye and can't already have winner
    check(
      'active_state_check',
      sql`${table.status} != 'active' OR (${table.isBye} = false AND ${table.winnerId} IS NULL)`,
    ),

    // an active matchup MUST have both entries and both seeds
    check(
      'active_entries_check',
      sql`${table.status} != 'active' OR (${table.entryAId} IS NOT NULL AND ${table.entryBId} IS NOT NULL AND ${table.seedA} IS NOT NULL AND ${table.seedB} IS NOT NULL)`,
    ),

    // a BYE matchup must be flagged as BYE and must have a winner
    check(
      'bye_consistency_check',
      sql`${table.status} != 'bye' OR (${table.isBye} = true AND ${table.winnerId} IS NOT NULL)`,
    ),

    // A BYE matchup has no second entry
    check(
      'bye_nullability_check',
      sql`${table.status} != 'bye' OR (${table.entryBId} IS NULL AND ${table.seedB} IS NULL)`,
    ),
  ],
);
