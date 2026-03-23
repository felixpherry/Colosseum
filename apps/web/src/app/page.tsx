'use client';

import { useState } from 'react';
import { VoteCard } from '@/components/vote-card';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isVoteable } from '@/lib/matchup';

const mockMatchup = {
  id: '1',
  tournamentId: 't1',
  tournamentTitle: 'Best Album of 2025',
  tournamentSlug: 'best-album-of-2025-a3x9',
  round: 1,
  totalRounds: 3,
  entryA: { id: 'a1', title: 'Midnight Echoes', imageUrl: null },
  entryB: { id: 'b1', title: 'Neon Horizons', imageUrl: null },
  closesAt: new Date(Date.now() + 1000 * 60 * 60 * 2.5),
  votesA: 42,
  votesB: 37,
  userVote: null,
  winnerId: null,
};

const mockMatchupVoted = {
  ...mockMatchup,
  id: '2',
  tournamentTitle: 'Best Pizza Topping of All Time',
  tournamentSlug: 'best-pizza-topping-b7f2',
  entryA: { id: 'a2', title: 'Pepperoni', imageUrl: null },
  entryB: { id: 'b2', title: 'Pineapple', imageUrl: null },
  closesAt: new Date(Date.now() + 1000 * 45),
  votesA: 128,
  votesB: 89,
  userVote: 'a2',
  winnerId: null,
};

const mockMatchupExpired = {
  ...mockMatchup,
  id: '3',
  tournamentTitle: 'Hottest Programming Language',
  tournamentSlug: 'hottest-lang-c4d1',
  entryA: { id: 'a3', title: 'Rust', imageUrl: null },
  entryB: { id: 'b3', title: 'Go', imageUrl: null },
  closesAt: new Date(Date.now() - 1000 * 60),
  votesA: 256,
  votesB: 201,
  userVote: 'a3',
  winnerId: 'a3',
};

const mockMatchupClosingSoon = {
  ...mockMatchup,
  id: '4',
  tournamentTitle: 'Greatest Movie Villain',
  tournamentSlug: 'greatest-villain-d5e2',
  round: 2,
  entryA: { id: 'a4', title: 'Hans Gruber', imageUrl: null },
  entryB: { id: 'b4', title: 'Darth Vader', imageUrl: null },
  closesAt: new Date(Date.now() + 1000 * 60 * 3),
  votesA: 89,
  votesB: 91,
  userVote: null,
  winnerId: null,
};

export default function Home() {
  const [showRecent, setShowRecent] = useState(false);

  const allMatchups = [
    mockMatchup,
    mockMatchupVoted,
    mockMatchupClosingSoon,
    mockMatchupExpired,
  ];

  // Fix #1: single isVoteable gate for filtering AND count
  const actionable = allMatchups.filter(isVoteable);
  const recent = allMatchups.filter((m) => !isVoteable(m));

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-h1 text-text-900">Vote Now</h1>
          {/* Fix #1: tolerant copy */}
          <p className="text-body text-text-500 mt-1">
            {actionable.length > 0
              ? `${actionable.length} matchup${actionable.length !== 1 ? 's' : ''} to vote on`
              : 'You\u2019re all caught up'}
          </p>
          <p className="text-caption text-text-300 mt-0.5">
            Pick winners to advance the bracket.
          </p>
        </div>

        {/* Active matchups */}
        {actionable.length > 0 ? (
          <div className="space-y-3">
            {actionable.map((m) => (
              <VoteCard
                key={m.id}
                matchup={m}
                onTap={(m) => console.log('vote', m.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-text-300 text-body">
            No active matchups right now. Check back soon.
          </div>
        )}

        {/* Fix #2: clearly interactive collapse with animated chevron + Show/Hide label */}
        {recent.length > 0 && (
          <div className="pt-2 border-t border-surface-200/50">
            <button
              className={cn(
                'flex items-center gap-2 w-full px-2 py-2 -mx-2 rounded-md',
                'text-text-300 hover:text-text-500 hover:bg-surface-100/50',
                'transition-colors duration-150',
              )}
              onClick={() => setShowRecent(!showRecent)}
            >
              <span className="text-caption uppercase tracking-wide font-medium">
                Recent activity
              </span>
              <span className="text-[11px] bg-surface-100 text-text-300 px-1.5 py-0.5 rounded-full">
                {recent.length}
              </span>
              <span className="text-[11px] ml-auto mr-1">
                {showRecent ? 'Hide' : 'Show'}
              </span>
              <ChevronDown
                className={cn(
                  'size-3.5 transition-transform duration-200',
                  showRecent && 'rotate-180',
                )}
              />
            </button>

            {showRecent && (
              <div className="space-y-2 mt-2">
                {recent.map((m) => (
                  <VoteCard
                    key={m.id}
                    matchup={m}
                    onTap={(m) => console.log('view', m.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
