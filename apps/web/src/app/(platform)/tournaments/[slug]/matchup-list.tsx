'use client';

import { trpc } from '@/trpc/client';
import { CountdownTimer } from '@/components/countdown-timer';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function MatchupList({ tournamentId }: { tournamentId: string }) {
  const { data: matchups, refetch } = trpc.tournament.listMatchups.useQuery({
    tournamentId,
  });

  const { mutate: castVote } = trpc.vote.cast.useMutation({
    onSuccess: () => {
      toast.success('Vote cast!');
      refetch();
    },
    onError: (err) => {
      if (err.data?.code === 'TOO_MANY_REQUESTS') {
        toast.error('Slow down! Wait a few seconds between votes.');
      } else if (err.data?.code === 'CONFLICT') {
        toast.error('You already voted on this matchup.');
      } else if (err.data?.code === 'PRECONDITION_FAILED') {
        toast.error('This matchup has closed.');
        refetch();
      } else {
        toast.error('Something went wrong. Try again.');
      }
    },
  });

  if (!matchups)
    return <div className="text-text-500">Loading matchups...</div>;

  const activeMatchups = matchups.filter((m) => m.status === 'active');
  const completedMatchups = matchups.filter((m) => m.status === 'completed');
  const pendingMatchups = matchups.filter(
    (m) => m.status === 'pending' || m.status === 'bye',
  );

  return (
    <div className="space-y-6">
      {/* Active matchups — voteable */}
      {activeMatchups.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-h3 text-text-900">Active Matchups</h3>
          {activeMatchups.map((m) => (
            <div
              key={m.id}
              className="bg-surface-0 border border-surface-200 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between text-caption text-text-300">
                <span>
                  Round {m.round} · Position {m.position}
                </span>
                <CountdownTimer closesAt={m.closesAt} variant="active" />
              </div>

              <div className="flex items-center gap-4">
                {/* Entry A */}
                <button
                  className={cn(
                    'flex-1 p-3 rounded-lg border-2 transition-colors text-center',
                    'hover:border-brand-500 hover:bg-brand-500/5',
                    'border-surface-200',
                  )}
                  onClick={() =>
                    castVote({ matchupId: m.id, submissionId: m.entryAId! })
                  }
                >
                  <div className="text-body font-medium text-text-900">
                    {m.entryA?.title ?? 'Unknown'}
                  </div>
                  <div className="text-caption text-text-300 mt-1">
                    Seed {m.seedA} · {m.votesA} votes
                  </div>
                </button>

                <span className="text-text-300 text-caption font-medium shrink-0">
                  VS
                </span>

                {/* Entry B */}
                <button
                  className={cn(
                    'flex-1 p-3 rounded-lg border-2 transition-colors text-center',
                    'hover:border-brand-500 hover:bg-brand-500/5',
                    'border-surface-200',
                  )}
                  onClick={() =>
                    castVote({ matchupId: m.id, submissionId: m.entryBId! })
                  }
                >
                  <div className="text-body font-medium text-text-900">
                    {m.entryB?.title ?? 'Unknown'}
                  </div>
                  <div className="text-caption text-text-300 mt-1">
                    Seed {m.seedB} · {m.votesB} votes
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed matchups */}
      {completedMatchups.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-h3 text-text-900">Completed</h3>
          {completedMatchups.map((m) => (
            <div
              key={m.id}
              className="bg-surface-0 border border-surface-200 rounded-lg p-4 opacity-70"
            >
              <div className="flex items-center justify-between text-caption text-text-300 mb-2">
                <span>
                  Round {m.round} · Position {m.position}
                </span>
                <span>Ended</span>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex-1 p-2 rounded-lg text-center',
                    m.winnerId === m.entryAId
                      ? 'bg-success-500/10 border border-success-500/30'
                      : 'bg-surface-50',
                  )}
                >
                  <span className="text-body text-text-900">
                    {m.entryA?.title ?? 'Unknown'}
                  </span>
                  <span className="text-caption text-text-300 ml-2">
                    {m.votesA}
                  </span>
                  {m.winnerId === m.entryAId && (
                    <span className="text-[10px] text-emerald-400 font-semibold ml-1">
                      Winner
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    'flex-1 p-2 rounded-lg text-center',
                    m.winnerId === m.entryBId
                      ? 'bg-success-500/10 border border-success-500/30'
                      : 'bg-surface-50',
                  )}
                >
                  <span className="text-body text-text-900">
                    {m.entryB?.title ?? 'Unknown'}
                  </span>
                  <span className="text-caption text-text-300 ml-2">
                    {m.votesB}
                  </span>
                  {m.winnerId === m.entryBId && (
                    <span className="text-[10px] text-emerald-400 font-semibold ml-1">
                      Winner
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending matchups */}
      {pendingMatchups.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-h3 text-text-500">Upcoming</h3>
          {pendingMatchups.map((m) => (
            <div
              key={m.id}
              className="bg-surface-0 border border-surface-200 rounded-lg p-4 opacity-50"
            >
              <div className="text-caption text-text-300 mb-2">
                Round {m.round} · Position {m.position}
                {m.isBye && ' · BYE'}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center text-body text-text-500">
                  {m.entryA?.title ?? 'TBD'}
                </div>
                <span className="text-text-300 text-caption">VS</span>
                <div className="flex-1 text-center text-body text-text-500">
                  {m.entryB?.title ?? 'TBD'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
