import { calculateTotalRounds } from './tournament';

export type MatchupData = {
  round: number;
  position: number;
  entryAId: string | null;
  entryBId: string | null;
  seedA: number | null;
  seedB: number | null;
  isBye: boolean;
  status: 'pending' | 'active' | 'bye';
  winnerId: string | null;
};

/**
 * Generates standard tournament seed positions.
 * For n=8: [1, 8, 4, 5, 2, 7, 3, 6]
 * Adjacent pairs become round 1 matchups: 1v8, 4v5, 2v7, 3v6
 */
export function generateSeedOrder(bracketSize: number): number[] {
  let seeds = [1];

  while (seeds.length < bracketSize) {
    const nextSize = seeds.length * 2;
    seeds = seeds.flatMap((seed) => [seed, nextSize + 1 - seed]);
  }

  return seeds;
}

/**
 * Finds the smallest power of 2 that fits all entries.
 * 20 entries → 32, 9 entries → 16, 5 entries → 8
 */
export function calculateBracketSize(entryCount: number): number {
  if (entryCount < 3) {
    throw new Error('Entry count must be greater than 2');
  }

  let size = 4;
  while (size < entryCount) {
    size *= 2;
  }
  return size;
}

/**
 * Generates all matchup data for a bracket.
 * - Round 1: seeds placed, BYEs resolved
 * - Round 2+: empty pending matchups awaiting winners
 */
export function generateBracketData(
  submissions: { id: string }[],
  bracketSize: number,
): MatchupData[] {
  bracketSize = Math.min(bracketSize, calculateBracketSize(submissions.length));

  const seeds = generateSeedOrder(bracketSize);
  const totalRounds = calculateTotalRounds(bracketSize);
  const matchups: MatchupData[] = [];

  // Round 1 — seed matchups and BYEs
  for (let i = 0; i < seeds.length; i += 2) {
    const entryA = submissions[seeds[i] - 1];
    const entryB = submissions[seeds[i + 1] - 1];
    const hasBothEntries = !!entryA && !!entryB;

    matchups.push({
      round: 1,
      position: i >> 1,
      entryAId: entryA?.id ?? null,
      entryBId: entryB?.id ?? null,
      seedA: entryA ? seeds[i] : null,
      seedB: entryB ? seeds[i + 1] : null,
      isBye: !hasBothEntries,
      status: hasBothEntries ? 'pending' : 'bye',
      winnerId: hasBothEntries ? null : (entryA?.id ?? entryB?.id ?? null),
    });
  }

  // Round 2+ — empty matchups awaiting winners
  let matchupsInRound = bracketSize / 4;
  for (let round = 2; round <= totalRounds; round++) {
    for (let position = 0; position < matchupsInRound; position++) {
      matchups.push({
        round,
        position,
        entryAId: null,
        entryBId: null,
        seedA: null,
        seedB: null,
        isBye: false,
        status: 'pending',
        winnerId: null,
      });
    }
    matchupsInRound /= 2;
  }

  return matchups;
}
