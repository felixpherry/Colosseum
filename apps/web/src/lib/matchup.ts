import type { ActiveMatchup } from '@/types/matchup';

/**
 * Single source of truth for whether a matchup is voteable.
 * Used by: feed filtering, card CTA, vote modal gate.
 */
export function isVoteable(matchup: ActiveMatchup): boolean {
  const now = new Date();
  return (
    matchup.userVote === null &&
    matchup.winnerId === null &&
    new Date(matchup.closesAt) > now
  );
}
