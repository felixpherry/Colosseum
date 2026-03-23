'use client';

import type { ActiveMatchup } from '@/types/matchup';
import { CountdownTimer } from './countdown-timer';
import { Card } from './ui/card';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountdown } from '@/hooks/use-countdown';
import { isVoteable } from '@/lib/matchup';

type VoteCardProps = {
  matchup: ActiveMatchup;
  onTap: (matchup: ActiveMatchup) => void;
};

function EntryThumbnail({
  entry,
  isSelected,
  isWinner,
}: {
  entry: { id: string; title: string; imageUrl: string | null };
  isSelected: boolean;
  isWinner: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
      {entry.imageUrl ? (
        <img
          className="size-10 rounded-full object-cover"
          src={entry.imageUrl}
          alt=""
          draggable={false}
        />
      ) : (
        <div className="size-10 rounded-full bg-surface-100 flex items-center justify-center text-body font-semibold text-text-500">
          {entry.title.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-body text-text-900 font-medium truncate max-w-full leading-tight">
        {entry.title}
      </span>
      {isWinner && (
        <span className="text-[9px] font-semibold text-emerald-400 leading-none">
          Winner
        </span>
      )}

      {/* Fix #4: neutral badge, not purple — avoids looking like a link */}
      {isSelected && !isWinner && (
        <span className="text-[9px] font-medium text-text-300 bg-surface-100 px-1.5 py-0.5 rounded-full leading-none">
          Your pick
        </span>
      )}
    </div>
  );
}

function getRoundLabel(round: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - round;
  if (roundsFromEnd === 0) return 'Final';
  if (roundsFromEnd === 1) return 'Semifinal';
  if (roundsFromEnd === 2) return 'Quarterfinal';
  return `Round ${round}`;
}

function getCtaLabel(
  isExpired: boolean,
  hasVoted: boolean,
  isResolved: boolean,
): string {
  if (!isExpired && !hasVoted) return 'Vote';
  if (isResolved) return 'View result';
  return 'View bracket';
}

export function VoteCard({ matchup, onTap }: VoteCardProps) {
  const { isExpired } = useCountdown(matchup.closesAt);
  const hasVoted = matchup.userVote !== null;
  const isResolved = matchup.winnerId !== null;
  const actionable = isVoteable(matchup);
  const ctaLabel = getCtaLabel(isExpired, hasVoted, isResolved);

  return (
    <Card
      className={cn(
        'group bg-surface-0 rounded-lg border border-surface-200',
        'select-none px-3 py-2.5',
        'cursor-pointer transition-colors duration-150',
        // Fix #5: single hover effect (border brighten), single active effect (bg tint)
        'hover:border-brand-500/30 hover:shadow-sm',
        'active:bg-surface-50',
        !actionable && 'opacity-60 hover:opacity-80',
      )}
      onClick={() => onTap(matchup)}
      style={{ WebkitTouchCallout: 'none' }}
    >
      {/* Tournament title */}
      <span className="text-[11px] text-text-300 truncate block mb-2">
        {matchup.tournamentTitle}
      </span>

      {/* Main content: entries (left) + action stack (right) */}
      <div className="flex items-center gap-3">
        {/* Entries cluster */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <EntryThumbnail
            entry={matchup.entryA}
            isSelected={matchup.userVote === matchup.entryA.id}
            isWinner={matchup.winnerId === matchup.entryA.id}
          />
          <div className="w-px h-8 bg-surface-200 shrink-0" />
          <EntryThumbnail
            entry={matchup.entryB}
            isSelected={matchup.userVote === matchup.entryB.id}
            isWinner={matchup.winnerId === matchup.entryB.id}
          />
        </div>

        {/* Action stack: round label + CTA + timer */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          {/* Fix #6: plain text label, not a pill — CTA is the only button-shaped element */}
          <span className="text-[10px] text-text-300">
            {getRoundLabel(matchup.round, matchup.totalRounds)}
          </span>

          <div
            className={cn(
              'flex items-center gap-0.5 px-2.5 py-1 rounded-full transition-colors',
              actionable
                ? 'bg-brand-500/10 text-brand-500 group-hover:bg-brand-500/20'
                : 'bg-surface-100 text-text-500 group-hover:bg-surface-200',
            )}
          >
            <span
              className={cn(
                'text-caption',
                actionable ? 'font-semibold' : 'font-medium',
              )}
            >
              {ctaLabel}
            </span>
            <ChevronRight className="size-3.5" />
          </div>

          {/* Fix #3: timer directly under CTA, aligned right with it */}
          <CountdownTimer
            closesAt={matchup.closesAt}
            variant={isResolved ? 'resolved' : hasVoted ? 'passive' : 'active'}
          />
        </div>
      </div>
    </Card>
  );
}
