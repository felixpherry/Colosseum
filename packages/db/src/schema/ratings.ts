import {
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './auth';

export const userRatings = pgTable(
  'user_ratings',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    category: text().notNull(),
    rating: integer().notNull().default(1200),
    matchesPlayed: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique('user_category_rating').on(table.userId, table.category)],
);
