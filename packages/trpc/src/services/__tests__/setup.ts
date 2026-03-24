import { db, users, tournaments, submissions, sql } from '@colosseum/db';

export const testDb = db;

export async function cleanDb() {
  await testDb.execute(sql`
    TRUNCATE TABLE 
      votes, matchups, submissions, tournament_stats, 
      user_ratings, tournaments, accounts, users 
    CASCADE
  `);
}

export async function createTestUser(name: string) {
  const [user] = await testDb
    .insert(users)
    .values({
      name,
      username: `${name.toLowerCase()}_${Math.random().toString(36).slice(2, 6)}`,
      email: `${name.toLowerCase()}_${Math.random().toString(36).slice(2, 6)}@test.com`,
    })
    .returning();
  return user;
}

export async function createTestTournament(
  creatorId: string,
  overrides: Partial<typeof tournaments.$inferInsert> = {},
) {
  const [tournament] = await testDb
    .insert(tournaments)
    .values({
      creatorId,
      title: 'Test Tournament',
      slug: `test-tournament-${Math.random().toString(36).slice(2, 6)}`,
      category: 'testing',
      size: 8,
      totalRounds: 3,
      status: 'accepting_submissions',
      matchupDurationHours: 1,
      ...overrides,
    })
    .returning();
  return tournament;
}

export async function createTestSubmissions(
  tournamentId: string,
  userIds: string[],
) {
  const rows = userIds.map((userId, i) => ({
    tournamentId,
    submitterId: userId,
    title: `Entry ${i + 1}`,
  }));
  return testDb.insert(submissions).values(rows).returning();
}
