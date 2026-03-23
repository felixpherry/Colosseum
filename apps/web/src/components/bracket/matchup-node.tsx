'use client';

import { cn } from '@/lib/utils';
import { CountdownTimer } from '../countdown-timer';
import { Trophy } from 'lucide-react';

type MatchupNodeProps = {
  matchup: {
    id: string;
    round: number;
    position: number;
    status: string;
    isBye: boolean;
    entryA: { id: string; title: string } | null;
    entryB: { id: string; title: string } | null;
    seedA: number | null;
    seedB: number | null;
    votesA: number;
    votesB: number;
    winnerId: string | null;
    closesAt: Date | null;
  };
  height: number;
  isFinal?: boolean;
  onVote?: (matchupId: string, submissionId: string) => void;
};

export function MatchupNode({ matchup, height, isFinal, onVote }: MatchupNodeProps) {
  const isActive = matchup.status === 'active';
  const isCompleted = matchup.status === 'completed';
  const isBye = matchup.status === 'bye';
  const isPending = matchup.status === 'pending';

  return (
    <div
      className={cn(
        'absolute bg-surface-0 border rounded-md overflow-hidden transition-colors',
        'flex flex-col',
        isActive && 'border-brand-500/50 shadow-sm',
        isCompleted && 'border-surface-200',
        isBye && 'border-surface-200 opacity-50',
        isPending && 'border-surface-200 opacity-40',
      )}
      style={{ height: `${height}px`, width: '180px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-0.5 bg-surface-50 border-b border-surface-200">
        <span className="text-[9px] text-text-300">
          {isBye ? 'BYE' : isFinal ? 'Final' : `R${matchup.round}`}
        </span>
        {isActive && matchup.closesAt && (
          <CountdownTimer closesAt={matchup.closesAt} variant="active" />
        )}
        {isCompleted && (
          <span className="text-[9px] text-text-300">Ended</span>
        )}
      </div>

      {/* Entry A */}
      <button
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 flex-1 min-h-0 transition-colors text-left',
          isActive && 'hover:bg-brand-500/5 cursor-pointer',
          !isActive && 'cursor-default',
          matchup.winnerId === matchup.entryA?.id && 'bg-success-500/10',
        )}
        onClick={() => {
          if (isActive && matchup.entryA && onVote) {
            onVote(matchup.id, matchup.entryA.id);
          }
        }}
        disabled={!isActive}
      >
        {matchup.entryA ? (
          <>
            <span className="text-[10px] text-text-300 font-mono w-4 shrink-0">
              {matchup.seedA}
            </span>
            <span className="text-caption text-text-900 font-medium truncate flex-1">
              {matchup.entryA.title}
            </span>
            {isCompleted && (
              <span className="text-[10px] text-text-300 font-mono shrink-0">
                {matchup.votesA}
              </span>
            )}
            {matchup.winnerId === matchup.entryA.id && (
              <Trophy className="size-3 text-emerald-400 shrink-0" />
            )}
          </>
        ) : (
          <span className="text-[10px] text-text-300 italic">TBD</span>
        )}
      </button>

      {/* Divider */}
      <div className="h-px bg-surface-200" />

      {/* Entry B */}
      <button
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 flex-1 min-h-0 transition-colors text-left',
          isActive && 'hover:bg-brand-500/5 cursor-pointer',
          !isActive && 'cursor-default',
          matchup.winnerId === matchup.entryB?.id && 'bg-success-500/10',
        )}
        onClick={() => {
          if (isActive && matchup.entryB && onVote) {
            onVote(matchup.id, matchup.entryB.id);
          }
        }}
        disabled={!isActive}
      >
        {matchup.entryB ? (
          <>
            <span className="text-[10px] text-text-300 font-mono w-4 shrink-0">
              {matchup.seedB}
            </span>
            <span className="text-caption text-text-900 font-medium truncate flex-1">
              {matchup.entryB.title}
            </span>
            {isCompleted && (
              <span className="text-[10px] text-text-300 font-mono shrink-0">
                {matchup.votesB}
              </span>
            )}
            {matchup.winnerId === matchup.entryB.id && (
              <Trophy className="size-3 text-emerald-400 shrink-0" />
            )}
          </>
        ) : (
          <span className="text-[10px] text-text-300 italic">{isBye ? '—' : 'TBD'}</span>
        )}
      </button>
    </div>
  );
}
