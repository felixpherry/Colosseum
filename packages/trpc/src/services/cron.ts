import { db, matchups, eq, and, lte } from '@colosseum/db';
import { resolveMatchup } from './resolve';
import { getBoss } from './worker';
import { refreshTrendingScores } from './trending';

export async function startCronJobs() {
  const boss = await getBoss();

  await boss.work('resolve-matchup', async ([job]) => {
    const data = job.data as { matchupId: string };
    await resolveMatchup(db, data.matchupId);
  });

  await boss.schedule('close-expired-matchups', '* * * * *', {});
  await boss.work('close-expired-matchups', async () => {
    const now = new Date();
    const expiredActiveMatchups = await db
      .select()
      .from(matchups)
      .where(and(eq(matchups.status, 'active'), lte(matchups.closesAt, now)));

    for (const matchup of expiredActiveMatchups) {
      await boss.send(
        'resolve-matchup',
        { matchupId: matchup.id },
        { singletonKey: matchup.id },
      );
    }
  });

  await boss.schedule('refresh-trending', '*/5 * * * *', {});
  await boss.work('refresh-trending', async () => {
    await refreshTrendingScores(db);
  });
}
