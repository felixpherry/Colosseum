import { auth } from '@/lib/auth';
import { api } from '@/trpc/server';
import { notFound } from 'next/navigation';
import { SubmissionForm } from './submission-form';
import { OpenSubmissionsButton } from './open-submissions-button';
import { StartTournamentButton } from './start-tournament-button';
import { MatchupList } from './matchup-list';
import { BracketView } from '@/components/bracket/bracket-view';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Clock, Swords } from 'lucide-react';

const statusConfig = {
  draft: { label: 'Draft', variant: 'secondary' as const },
  accepting_submissions: {
    label: 'Open for entries',
    variant: 'default' as const,
  },
  in_progress: { label: 'In Progress', variant: 'default' as const },
  completed: { label: 'Completed', variant: 'secondary' as const },
  cancelled: { label: 'Cancelled', variant: 'destructive' as const },
};

function TournamentHeader({
  tournament,
}: {
  tournament: {
    title: string;
    description: string | null;
    category: string;
    size: number;
    status: string;
    matchupDurationHours: number;
    totalRounds: number;
  };
}) {
  const status = statusConfig[tournament.status as keyof typeof statusConfig];

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-h1 text-text-900">{tournament.title}</h1>
        <Badge variant={status.variant} className="shrink-0 mt-1">
          {status.label}
        </Badge>
      </div>

      {tournament.description && (
        <p className="text-body text-text-500">{tournament.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-caption text-text-300">
        <div className="flex items-center gap-1">
          <Swords className="size-3.5" />
          <span>{tournament.category}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="size-3.5" />
          <span>{tournament.size} entries</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="size-3.5" />
          <span>{tournament.matchupDurationHours}h per matchup</span>
        </div>
        <div className="flex items-center gap-1">
          <Trophy className="size-3.5" />
          <span>{tournament.totalRounds} rounds</span>
        </div>
      </div>
    </div>
  );
}

export default async function TournamentDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  const { slug } = await params;
  const trpc = await api();
  const tournament = await trpc.tournament.getBySlug({ slug });
  if (!tournament) notFound();

  const submissions = await trpc.submission.listByTournament({
    tournamentId: tournament.id,
  });

  const isCreator = session?.user?.id === tournament.creatorId;

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <TournamentHeader tournament={tournament} />

        {/* ── Draft ── */}
        {tournament.status === 'draft' && (
          <div className="space-y-4">
            <div className="bg-surface-0 border border-surface-200 rounded-lg p-6 text-center space-y-3">
              <p className="text-body text-text-500">
                This tournament is still in draft. Open submissions to let
                people submit entries.
              </p>
              {isCreator && (
                <OpenSubmissionsButton tournamentId={tournament.id} />
              )}
            </div>
          </div>
        )}

        {/* ── Accepting Submissions ── */}
        {tournament.status === 'accepting_submissions' && (
          <div className="space-y-6">
            <SubmissionForm tournamentId={tournament.id} />

            {/* Submission list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-h3 text-text-900">
                  Entries
                  <span className="text-text-300 font-normal ml-1.5">
                    {submissions.length}
                  </span>
                </h2>
                {isCreator && submissions.length >= 3 && (
                  <StartTournamentButton tournamentId={tournament.id} />
                )}
              </div>

              {submissions.length === 0 ? (
                <div className="bg-surface-0 border border-surface-200 rounded-lg p-6 text-center">
                  <p className="text-body text-text-300">
                    No entries yet. Be the first to submit.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {submissions.map((submission, i) => (
                    <div
                      key={submission.id}
                      className="bg-surface-0 border border-surface-200 rounded-lg px-4 py-3 flex items-center gap-3"
                    >
                      <span className="text-caption text-text-300 font-mono w-6 shrink-0">
                        #{i + 1}
                      </span>
                      {submission.imageUrl ? (
                        <img
                          src={submission.imageUrl}
                          alt=""
                          className="size-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="size-8 rounded-full bg-surface-100 flex items-center justify-center text-caption font-semibold text-text-500">
                          {submission.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-body text-text-900 font-medium truncate">
                        {submission.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {isCreator && submissions.length < 3 && (
                <p className="text-caption text-text-300 text-center">
                  Need at least 3 entries to start the tournament. Currently{' '}
                  {submissions.length}.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── In Progress ── */}
        {tournament.status === 'in_progress' && (
          <div className="space-y-8">
            {/* Bracket visualization */}
            <div>
              <h2 className="text-h3 text-text-900 mb-4">Bracket</h2>
              <BracketView
                tournamentId={tournament.id}
                totalRounds={tournament.totalRounds}
              />
            </div>

            {/* Matchup list (flat view) */}
            <div>
              <h2 className="text-h3 text-text-900 mb-4">All Matchups</h2>
              <MatchupList tournamentId={tournament.id} />
            </div>
          </div>
        )}

        {/* ── Completed ── */}
        {tournament.status === 'completed' && (
          <div className="space-y-8">
            {tournament.championSubmissionId && (
              <div className="bg-surface-0 border border-surface-200 rounded-lg p-6 text-center space-y-2">
                <Trophy className="size-8 text-tier-gold mx-auto" />
                <h2 className="text-h2 text-text-900">Champion</h2>
                <p className="text-body text-text-500">
                  {submissions.find(
                    (s) => s.id === tournament.championSubmissionId,
                  )?.title ?? 'Unknown'}
                </p>
              </div>
            )}

            <div>
              <h2 className="text-h3 text-text-900 mb-4">Final Bracket</h2>
              <BracketView
                tournamentId={tournament.id}
                totalRounds={tournament.totalRounds}
              />
            </div>
          </div>
        )}

        {/* ── Cancelled ── */}
        {tournament.status === 'cancelled' && (
          <div className="bg-surface-0 border border-surface-200 rounded-lg p-6 text-center">
            <p className="text-body text-text-500">
              This tournament has been cancelled.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
