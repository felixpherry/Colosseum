import { describe, it, expect, beforeEach } from 'vitest';
import {
  cleanDb,
  createTestUser,
  createTestTournament,
  createTestSubmissions,
  testDb,
} from './setup';
import { eq, and, matchups, votes, sql } from '@colosseum/db';
import { generateBracketData } from '@colosseum/lib';
import { insertBracket, advanceByes, activateReadyMatchups } from '../bracket';
import { beforeAll } from 'vitest';

// Helper: set up a tournament with an active matchup
async function setupActiveMatchup() {
  const creator = await createTestUser('Creator');
  const submitters = [];
  for (let i = 1; i <= 8; i++) {
    submitters.push(await createTestUser(`Sub-${i}`));
  }

  const tournament = await createTestTournament(creator.id, { size: 8 });
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

  // Get the first active matchup
  const [activeMatchup] = await testDb
    .select()
    .from(matchups)
    .where(
      and(
        eq(matchups.tournamentId, tournament.id),
        eq(matchups.status, 'active'),
      ),
    );

  return { creator, submitters, tournament, subs, activeMatchup };
}

async function castVote({
  matchupId,
  submissionId,
  userId,
  isEntryA,
}: {
  matchupId: string;
  submissionId: string;
  userId: string;
  isEntryA: boolean;
}) {
  const [matchup] = await testDb
    .select()
    .from(matchups)
    .where(eq(matchups.id, matchupId));
  if (!matchup.closesAt || matchup.closesAt <= new Date()) {
    throw new Error('Matchup does not accept submissions anymore');
  }
  if (matchup.entryAId !== submissionId && matchup.entryBId !== submissionId) {
    throw new Error("Entry doesn't exist in the current matchup");
  }
  await testDb.transaction(async (tx) => {
    // insert the vote into votes table
    await tx.insert(votes).values({
      matchupId,
      submissionId,
      userId,
    });
    // update the vote count
    await tx
      .update(matchups)
      .set(
        isEntryA
          ? {
              votesA: sql`${matchups.votesA} + 1`,
            }
          : {
              votesB: sql`${matchups.votesB} + 1`,
            },
      )
      .where(eq(matchups.id, matchupId));
  });
}

describe('vote flow', () => {
  let activeMatchup: Awaited<
    ReturnType<typeof setupActiveMatchup>
  >['activeMatchup'];
  let tournament: Awaited<ReturnType<typeof setupActiveMatchup>>['tournament'];

  beforeAll(async () => {
    await cleanDb();
    const result = await setupActiveMatchup();
    activeMatchup = result.activeMatchup;
    tournament = result.tournament;
  });

  beforeEach(async () => {
    // Only clean votes between tests — leave tournament/matchups intact
    await testDb.delete(votes);
    // Reset vote counts
    await testDb
      .update(matchups)
      .set({ votesA: 0, votesB: 0 })
      .where(eq(matchups.tournamentId, tournament.id));
    // Reset closesAt in case a test expired it
    await testDb
      .update(matchups)
      .set({ closesAt: new Date(Date.now() + 1000 * 60 * 60) })
      .where(
        and(
          eq(matchups.tournamentId, tournament.id),
          eq(matchups.status, 'active'),
        ),
      );
  });

  it('valid vote inserts a row and increments the correct counter', async () => {
    const voter = await createTestUser('voter');
    await castVote({
      matchupId: activeMatchup.id,
      submissionId: activeMatchup.entryAId!,
      userId: voter.id,
      isEntryA: true,
    });

    const voteRows = await testDb
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.matchupId, activeMatchup.id),
          eq(votes.submissionId, activeMatchup.entryAId!),
        ),
      );
    const [matchup] = await testDb
      .select()
      .from(matchups)
      .where(eq(matchups.id, activeMatchup.id));

    expect(voteRows.length).toBe(matchup.votesA);
  });

  it('duplicate vote is rejected by unique constraint', async () => {
    const voter = await createTestUser('voter');
    const voteConfig = {
      matchupId: activeMatchup.id,
      submissionId: activeMatchup.entryAId!,
      userId: voter.id,
      isEntryA: true,
    };
    await castVote(voteConfig);
    await expect(async () => await castVote(voteConfig)).rejects.toThrow();
  });

  it('vote on expired matchup: what happens?', async () => {
    const voter = await createTestUser('voter');

    // update the closesAt
    await testDb
      .update(matchups)
      .set({
        closesAt: new Date(),
      })
      .where(eq(matchups.id, activeMatchup.id));

    const voteConfig = {
      matchupId: activeMatchup.id,
      submissionId: activeMatchup.entryAId!,
      userId: voter.id,
      isEntryA: true,
    };
    await expect(async () => await castVote(voteConfig)).rejects.toThrow();
  });

  it('vote for a submission not in the matchup is rejected', async () => {
    const voter = await createTestUser('voter');

    // Create a submission in a DIFFERENT tournament
    const otherCreator = await createTestUser('OtherCreator');
    const otherTournament = await createTestTournament(otherCreator.id);
    const [foreignSub] = await createTestSubmissions(otherTournament.id, [
      voter.id,
    ]);

    const voteConfig = {
      matchupId: activeMatchup.id,
      submissionId: foreignSub.id,
      userId: voter.id,
      isEntryA: true,
    };

    await expect(async () => await castVote(voteConfig)).rejects.toThrow();
  });

  it('vote counts match actual vote rows', async () => {
    const voters = [];
    for (let i = 0; i < 5; i++) {
      voters.push(await createTestUser('voter'));
    }

    await castVote({
      matchupId: activeMatchup.id,
      submissionId: activeMatchup.entryAId!,
      userId: voters[0].id,
      isEntryA: true,
    });
    await castVote({
      matchupId: activeMatchup.id,
      submissionId: activeMatchup.entryBId!,
      userId: voters[1].id,
      isEntryA: false,
    });
    await castVote({
      matchupId: activeMatchup.id,
      submissionId: activeMatchup.entryAId!,
      userId: voters[2].id,
      isEntryA: true,
    });
    await castVote({
      matchupId: activeMatchup.id,
      submissionId: activeMatchup.entryBId!,
      userId: voters[3].id,
      isEntryA: false,
    });
    await castVote({
      matchupId: activeMatchup.id,
      submissionId: activeMatchup.entryAId!,
      userId: voters[4].id,
      isEntryA: true,
    });

    const voteRowsA = await testDb
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.matchupId, activeMatchup.id),
          eq(votes.submissionId, activeMatchup.entryAId!),
        ),
      );

    const voteRowsB = await testDb
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.matchupId, activeMatchup.id),
          eq(votes.submissionId, activeMatchup.entryBId!),
        ),
      );

    const [matchup] = await testDb
      .select()
      .from(matchups)
      .where(eq(matchups.id, activeMatchup.id));

    expect(voteRowsA.length).toBe(matchup.votesA);
    expect(voteRowsB.length).toBe(matchup.votesB);
  });
}, 20000);
