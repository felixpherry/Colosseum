import {
  matchups,
  tournaments,
  submissions,
  eq,
  and,
  isNull,
  type DbOrTx,
  userRatings,
  sql,
} from '@colosseum/db';
import { activateReadyMatchups } from './bracket';
import { calculateNewRatings } from '@colosseum/lib';

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

    const isEven = matchup.position % 2 === 0;
    const isWinnerA = winnerId === matchup.entryAId;
    const winnerSeed = isWinnerA ? matchup.seedA : matchup.seedB;

    // select submissions
    const [submissionA] = await tx
      .select()
      .from(submissions)
      .where(eq(submissions.id, matchup.entryAId!));

    const [submissionB] = await tx
      .select()
      .from(submissions)
      .where(eq(submissions.id, matchup.entryBId!));

    // Skip ELO if either user was deleted
    if (!submissionA?.submitterId || !submissionB?.submitterId) {
      // skip ELO, continue to advancement
    } else {
      // Fetch ratings separately — missing row = new player
      const [ratingA] = await tx
        .select()
        .from(userRatings)
        .where(
          and(
            eq(userRatings.userId, submissionA.submitterId),
            eq(userRatings.category, tournament.category),
          ),
        );

      const [ratingB] = await tx
        .select()
        .from(userRatings)
        .where(
          and(
            eq(userRatings.userId, submissionB.submitterId),
            eq(userRatings.category, tournament.category),
          ),
        );

      const { newRatingA, newRatingB } = calculateNewRatings(
        ratingA?.rating ?? 1200,
        ratingB?.rating ?? 1200,
        ratingA?.matchesPlayed ?? 0,
        ratingB?.matchesPlayed ?? 0,
        winnerId === matchup.entryAId,
      );

      // upsert both...

      await tx
        .insert(userRatings)
        .values({
          category: tournament.category,
          userId: submissionA.submitterId,
          matchesPlayed: 1,
          rating: newRatingA,
        })
        .onConflictDoUpdate({
          target: [userRatings.category, userRatings.userId],
          set: {
            matchesPlayed: sql`${userRatings.matchesPlayed} + 1`,
            rating: newRatingA,
          },
        });

      await tx
        .insert(userRatings)
        .values({
          category: tournament.category,
          userId: submissionB.submitterId,
          matchesPlayed: 1,
          rating: newRatingB,
        })
        .onConflictDoUpdate({
          target: [userRatings.category, userRatings.userId],
          set: {
            matchesPlayed: sql`${userRatings.matchesPlayed} + 1`,
            rating: newRatingB,
          },
        });
    }

    if (nextRound > tournament.totalRounds) {
      const winnerSubmission = isWinnerA ? submissionA : submissionB;

      await tx
        .update(tournaments)
        .set({
          status: 'completed',
          championSubmissionId: winnerId,
          championUserId: winnerSubmission.submitterId,
          completedAt: now,
        })
        .where(eq(tournaments.id, tournament.id));

      return;
    }

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
