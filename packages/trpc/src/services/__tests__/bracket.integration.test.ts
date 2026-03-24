import { describe, it, expect, beforeEach } from 'vitest';
import {
  cleanDb,
  createTestUser,
  createTestTournament,
  createTestSubmissions,
  testDb,
} from './setup';
import { eq, matchups } from '@colosseum/db';
import { generateBracketData } from '@colosseum/lib';
import { insertBracket } from '../bracket';
import { advanceByes, activateReadyMatchups } from '../bracket';

describe('bracket pipeline', () => {
  beforeEach(cleanDb);

  it('5 entries in 8-slot bracket: correct matchup states after full pipeline', async () => {
    // TODO(human):
    const creator = await createTestUser('Creator');
    const submitters = [];
    for (let i = 1; i <= 5; i++) {
      submitters.push(await createTestUser(`Submitter-${i}`));
    }

    // total rounds should be inferred automatically
    const tournament = await createTestTournament(creator.id, {
      size: 8,
    });

    const submissions = await createTestSubmissions(
      tournament.id,
      submitters.map(({ id }) => id),
    );
    const bracketData = generateBracketData(submissions, 8);
    await insertBracket(testDb, tournament.id, bracketData);
    await advanceByes(testDb, tournament.id);
    await activateReadyMatchups(
      testDb,
      tournament.id,
      tournament.matchupDurationHours,
    );

    const allMatchups = await testDb
      .select()
      .from(matchups)
      .where(eq(matchups.tournamentId, tournament.id));

    expect(allMatchups.length).toBe(7);
    const round1Matchups = allMatchups.filter(({ round }) => round === 1);
    const round1Bye = round1Matchups.filter(({ isBye }) => isBye);
    const round1NonBye = round1Matchups.filter(({ isBye }) => !isBye);

    expect(round1Bye.length).toBe(3);
    expect(round1NonBye.length).toBe(1);
    expect(round1NonBye[0].status).toBe('active');

    const round2Matchups = allMatchups.filter(({ round }) => round === 2);
    const round2ActiveMatchups = round2Matchups.filter(
      ({ status }) => status === 'active',
    );
    expect(round2ActiveMatchups.length).toBe(1);
    expect(
      !!round2ActiveMatchups[0].entryAId && !!round2ActiveMatchups[0].entryBId,
    ).toBe(true);

    expect(
      round2Matchups.filter(
        ({ status, entryAId, entryBId }) =>
          status === 'pending' &&
          ((!!entryAId && !entryBId) || (!entryAId && !!entryBId)),
      ).length,
    ).toBe(1);

    const round3Matchups = allMatchups.filter(({ round }) => round === 3);
    expect(
      round3Matchups.filter(
        ({ status, entryAId, entryBId }) =>
          status === 'pending' && !entryAId && !entryBId,
      ).length,
    ).toBe(1);

    expect(
      allMatchups
        .filter(({ isBye }) => isBye)
        .every(({ winnerId }) => !!winnerId),
    ).toBe(true);
    expect(allMatchups.some(({ status }) => status === 'completed')).toBe(
      false,
    );
  });
}, 20000);
