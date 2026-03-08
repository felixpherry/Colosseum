import { pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { matchups } from './matchups';
import { users } from './auth';
import { submissions } from './submissions';

export const votes = pgTable(
  'votes',
  {
    id: uuid().primaryKey().defaultRandom(),
    matchupId: uuid()
      .references(() => matchups.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid().references(() => users.id, { onDelete: 'set null' }),
    submissionId: uuid().references(() => submissions.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique('user_matchup').on(table.matchupId, table.userId)],
);
