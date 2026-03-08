import { integer, pgTable, real, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tournaments } from './tournaments';

// precomputed trending tournaments
export const tournamentStats = pgTable('tournament_stats', {
  id: uuid().primaryKey().defaultRandom(),
  tournamentId: uuid()
    .references(() => tournaments.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  totalVotes: integer().notNull().default(0),
  // votes in the last 24 hours. the "hot" signal
  votes24h: integer().notNull().default(0),
  // for HN gravity formula
  trendingScore: real().notNull().default(0),
  lastCalculatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
