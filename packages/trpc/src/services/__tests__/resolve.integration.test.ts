import { describe, it, expect } from 'vitest';
import {
  cleanDb,
  createTestUser,
  createTestTournament,
  createTestSubmissions,
  testDb,
} from './setup';
import {
  eq,
  and,
  matchups,
  votes,
  tournaments,
  userRatings,
} from '@colosseum/db';
import { generateBracketData } from '@colosseum/lib';
import { insertBracket, advanceByes, activateReadyMatchups } from '../bracket';
import { resolveMatchup } from '../resolve';

async function setupAndVote() {
  await cleanDb();
  const creator = await createTestUser('Creator');
  const submitters = [];
  for (let i = 1; i <= 8; i++) {
    submitters.push(await createTestUser(`Sub-${i}`));
  }
  const tournament = await createTestTournament(creator.id, {
    size: 8,
    totalRounds: 3,
  });
  const subs = await createTestSubmissions(
    tournament.id,
    submitters.map((u) => u.id),
  );

  const bracketData = generateBracketData(subs, 8);
  await insertBracket(testDb, tournament.id, bracketData);
  await advanceByes(testDb, tournament.id);
  await activateReadyMatchups(
    testDb,
    tournament.id,
    tournament.matchupDurationHours,
  );

  const activeMatchups = await testDb
    .select()
    .from(matchups)
    .where(
      and(
        eq(matchups.tournamentId, tournament.id),
        eq(matchups.status, 'active'),
      ),
    );

  const voters = [];
  for (let i = 0; i < 4; i++) {
    voters.push(await createTestUser(`Voter-${i}`));
  }
  const m = activeMatchups[0];
  for (let i = 0; i < 3; i++) {
    await testDb.insert(votes).values({
      matchupId: m.id,
      submissionId: m.entryAId!,
      userId: voters[i].id,
    });
  }
  await testDb.insert(votes).values({
    matchupId: m.id,
    submissionId: m.entryBId!,
    userId: voters[3].id,
  });
  await testDb
    .update(matchups)
    .set({ votesA: 3, votesB: 1 })
    .where(eq(matchups.id, m.id));

  await testDb
    .update(matchups)
    .set({ closesAt: new Date(Date.now() - 1000) })
    .where(eq(matchups.id, m.id));

  return { tournament, subs, activeMatchups, voters, submitters };
}

// Helper: vote on a matchup and expire it so it can be resolved
async function voteAndExpire(
  matchupId: string,
  entryAId: string,
  entryBId: string,
  voterIds: string[],
  votesForA: number,
) {
  for (let i = 0; i < voterIds.length; i++) {
    const isForA = i < votesForA;
    await testDb.insert(votes).values({
      matchupId,
      submissionId: isForA ? entryAId : entryBId,
      userId: voterIds[i],
    });
  }
  await testDb
    .update(matchups)
    .set({
      votesA: votesForA,
      votesB: voterIds.length - votesForA,
      closesAt: new Date(Date.now() - 1000),
    })
    .where(eq(matchups.id, matchupId));
}

describe('matchup resolution', () => {
  it('resolves matchup: correct winner, advances to next round', async () => {
    const { activeMatchups } = await setupAndVote();
    const m = activeMatchups[0];
    await resolveMatchup(testDb, m.id);

    const [matchup] = await testDb
      .select()
      .from(matchups)
      .where(eq(matchups.id, m.id));

    expect(matchup.status).toBe('completed');
    expect(matchup.winnerId).toBe(matchup.entryAId);
    expect(matchup.resolvedAt).toBeDefined();

    const [round2Matchup] = await testDb
      .select()
      .from(matchups)
      .where(
        and(
          eq(matchups.tournamentId, matchup.tournamentId),
          eq(matchups.round, 2),
          eq(matchups.position, Math.floor(matchup.position / 2)),
        ),
      );

    const isEven = matchup.position % 2 === 0;
    if (isEven) {
      expect(round2Matchup.entryAId).toBe(matchup.winnerId);
    } else {
      expect(round2Matchup.entryBId).toBe(matchup.winnerId);
    }
  });

  it('activates next matchup when both slots are filled', async () => {
    const { activeMatchups, voters } = await setupAndVote();
    const m = activeMatchups[0];
    await resolveMatchup(testDb, m.id);

    const m2 = activeMatchups[1];
    await voteAndExpire(
      m2.id,
      m2.entryAId!,
      m2.entryBId!,
      voters.map((v) => v.id),
      3,
    );
    await resolveMatchup(testDb, m2.id);

    const round2Matchups = await testDb
      .select()
      .from(matchups)
      .where(
        and(eq(matchups.tournamentId, m.tournamentId), eq(matchups.round, 2)),
      );

    // At least one round 2 matchup should be active with both entries
    const activatedMatchup = round2Matchups.find(
      (m) => m.entryAId && m.entryBId,
    );
    expect(activatedMatchup).toBeDefined();
    expect(activatedMatchup!.status).toBe('active');
    expect(activatedMatchup!.activatesAt).toBeDefined();
    expect(activatedMatchup!.closesAt).toBeDefined();
  });

  it('completes tournament when finals are resolved', async () => {
    const { tournament, activeMatchups, voters } = await setupAndVote();

    // Resolve all round 1 matchups
    for (const m of activeMatchups) {
      // First matchup already has votes from setupAndVote
      if (m.id !== activeMatchups[0].id) {
        await voteAndExpire(
          m.id,
          m.entryAId!,
          m.entryBId!,
          voters.map((v) => v.id),
          3,
        );
      }
      await resolveMatchup(testDb, m.id);
    }

    // Get round 2 active matchups and resolve them
    const round2Active = await testDb
      .select()
      .from(matchups)
      .where(
        and(
          eq(matchups.tournamentId, tournament.id),
          eq(matchups.round, 2),
          eq(matchups.status, 'active'),
        ),
      );

    // Create fresh voters for round 2 (avoid unique constraint on votes)
    const round2Voters = [];
    for (let i = 0; i < 4; i++) {
      round2Voters.push(await createTestUser(`R2Voter-${i}`));
    }

    for (const m of round2Active) {
      await voteAndExpire(
        m.id,
        m.entryAId!,
        m.entryBId!,
        round2Voters.map((v) => v.id),
        3,
      );
      await resolveMatchup(testDb, m.id);
    }

    // Get finals and resolve
    const [finals] = await testDb
      .select()
      .from(matchups)
      .where(
        and(
          eq(matchups.tournamentId, tournament.id),
          eq(matchups.round, 3),
          eq(matchups.status, 'active'),
        ),
      );

    if (finals) {
      const finalsVoters = [];
      for (let i = 0; i < 4; i++) {
        finalsVoters.push(await createTestUser(`FinalsVoter-${i}`));
      }

      await voteAndExpire(
        finals.id,
        finals.entryAId!,
        finals.entryBId!,
        finalsVoters.map((v) => v.id),
        3,
      );
      await resolveMatchup(testDb, finals.id);
    }

    // Assert tournament is completed
    const [completedTournament] = await testDb
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournament.id));

    expect(completedTournament.status).toBe('completed');
    expect(completedTournament.championSubmissionId).toBeDefined();
    expect(completedTournament.championUserId).toBeDefined();
    expect(completedTournament.completedAt).toBeDefined();
  });

  it('ELO ratings are updated after resolution', async () => {
    const { activeMatchups, tournament } = await setupAndVote();
    const m = activeMatchups[0];
    await resolveMatchup(testDb, m.id);

    // Both players should have ratings in this tournament's category
    const ratings = await testDb
      .select()
      .from(userRatings)
      .where(eq(userRatings.category, tournament.category));

    // Should have exactly 2 ratings (one for each player)
    expect(ratings.length).toBe(2);

    // Find winner and loser ratings
    await testDb.select().from(matchups).where(eq(matchups.id, m.id));

    // Winner voted A (3 votes), so winnerId = entryAId
    // Winner should have rating > 1200, loser < 1200
    const winnerRating = ratings.find((r) => {
      // Need to trace: entryAId -> submission -> submitterId -> userRating.userId
      return r.rating > 1200;
    });
    const loserRating = ratings.find((r) => r.rating < 1200);

    expect(winnerRating).toBeDefined();
    expect(loserRating).toBeDefined();
    expect(winnerRating!.matchesPlayed).toBe(1);
    expect(loserRating!.matchesPlayed).toBe(1);
  });
}, 60000);
