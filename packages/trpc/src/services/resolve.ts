import {
  matchups,
  tournaments,
  submissions,
  eq,
  and,
  isNull,
  type DbOrTx,
} from '@colosseum/db';
import { activateReadyMatchups } from './bracket';

function determineWinner(matchup: typeof matchups.$inferSelect): string {
  const { votesA, votesB, entryAId, entryBId, seedA, seedB } = matchup;

  if (votesA > votesB) return entryAId!;
  if (votesB > votesA) return entryBId!;

  // Tie → lower seed number wins
  return seedA! < seedB! ? entryAId! : entryBId!;
}

export async function resolveMatchup(db: DbOrTx, matchupId: string) {
  await db.transaction(async (tx) => {
    // Lock and fetch
    const results = await tx
      .select()
      .from(matchups)
      .where(eq(matchups.id, matchupId))
      .for('update');

    if (!results[0] || results[0].status !== 'active') return;

    const matchup = results[0];
    const winnerId = determineWinner(matchup);
    const now = new Date();

    await tx
      .update(matchups)
      .set({ status: 'completed', winnerId, resolvedAt: now })
      .where(eq(matchups.id, matchupId));

    const [tournament] = await tx
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, matchup.tournamentId));

    if (!tournament) return;

    const nextRound = matchup.round + 1;
    const nextPosition = matchup.position >> 1;

    if (nextRound > tournament.totalRounds) {
      const [winner] = await tx
        .select()
        .from(submissions)
        .where(eq(submissions.id, winnerId));

      await tx
        .update(tournaments)
        .set({
          status: 'completed',
          championSubmissionId: winnerId,
          championUserId: winner.submitterId,
          completedAt: now,
        })
        .where(eq(tournaments.id, tournament.id));

      return;
    }

    const isEven = matchup.position % 2 === 0;
    const isWinnerA = winnerId === matchup.entryAId;
    const winnerSeed = isWinnerA ? matchup.seedA : matchup.seedB;

    await tx
      .update(matchups)
      .set(
        isEven
          ? { entryAId: winnerId, seedA: winnerSeed }
          : { entryBId: winnerId, seedB: winnerSeed },
      )
      .where(
        and(
          eq(matchups.tournamentId, matchup.tournamentId),
          eq(matchups.round, nextRound),
          eq(matchups.position, nextPosition),
          isEven ? isNull(matchups.entryAId) : isNull(matchups.entryBId),
        ),
      );

    await activateReadyMatchups(
      tx,
      tournament.id,
      tournament.matchupDurationHours,
    );
  });
}
