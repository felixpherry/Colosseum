import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  name: text(),
  username: text().unique().notNull(),
  email: text().unique().notNull(),
  emailVerifiedAt: timestamp({ withTimezone: true }),
  image: text(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable(
  'accounts',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refreshToken: text(),
    accessToken: text(),
    expiresAt: timestamp({ withTimezone: true }),
    tokenType: text(),
    scope: text(),
    idToken: text(),
  },
  (table) => [unique().on(table.provider, table.providerAccountId)],
);
