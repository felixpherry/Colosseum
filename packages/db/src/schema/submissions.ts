import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { tournaments } from './tournaments';
import { users } from './auth';

export const submissions = pgTable(
  'submissions',
  {
    id: uuid().primaryKey().defaultRandom(),
    tournamentId: uuid()
      .notNull()
      .references(() => tournaments.id, {
        onDelete: 'cascade',
      }),
    submitterId: uuid().references(() => users.id, { onDelete: 'set null' }),
    title: text().notNull(),
    imageUrl: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('one_submission_per_user').on(table.tournamentId, table.submitterId),
  ],
);
