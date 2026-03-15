import type { MatchupData } from '@colosseum/lib';
import {
  matchups,
  tournaments,
  eq,
  and,
  isNotNull,
  DbOrTx,
} from '@colosseum/db';

export async function insertBracket(
  db: DbOrTx,
  tournamentId: string,
  bracketData: MatchupData[],
) {
  return await db.transaction(async (tx) => {
    const insertedMatchups = await tx
      .insert(matchups)
      .values(
        bracketData.map((matchup) => ({
          ...matchup,
          tournamentId,
        })),
      )
      .returning();

    await tx
      .update(tournaments)
      .set({
        status: 'in_progress',
      })
      .where(eq(tournaments.id, tournamentId));
    return insertedMatchups;
  });
}

export async function advanceByes(db: DbOrTx, tournamentId: string) {
  const byeMatchups = await db
    .select()
    .from(matchups)
    .where(
      and(eq(matchups.tournamentId, tournamentId), eq(matchups.isBye, true)),
    );

  await db.transaction(async (tx) => {
    for (const matchup of byeMatchups) {
      const nextPosition = Math.floor(matchup.position / 2);
      const nextRound = matchup.round + 1;
      const winnerSeed = matchup.seedA ?? matchup.seedB;
      const isEven = matchup.position % 2 === 0;

      await tx
        .update(matchups)
        .set(
          isEven
            ? { entryAId: matchup.winnerId, seedA: winnerSeed }
            : { entryBId: matchup.winnerId, seedB: winnerSeed },
        )
        .where(
          and(
            eq(matchups.tournamentId, tournamentId),
            eq(matchups.round, nextRound),
            eq(matchups.position, nextPosition),
          ),
        );
    }
  });
}

export async function activateReadyMatchups(
  db: DbOrTx,
  tournamentId: string,
  matchupDurationHours: number,
) {
  const now = new Date();
  const closesAt = new Date(
    now.getTime() + matchupDurationHours * 60 * 60 * 1000,
  );

  await db
    .update(matchups)
    .set({
      status: 'active',
      activatesAt: now,
      closesAt,
    })
    .where(
      and(
        eq(matchups.tournamentId, tournamentId),
        eq(matchups.status, 'pending'),
        isNotNull(matchups.entryAId),
        isNotNull(matchups.entryBId),
      ),
    );
}
