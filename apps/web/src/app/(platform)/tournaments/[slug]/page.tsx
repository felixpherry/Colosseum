import { auth } from '@/lib/auth';
import { api } from '@/trpc/server';
import { notFound } from 'next/navigation';
import { SubmissionForm } from './submission-form';
import Image from 'next/image';
import { OpenSubmissionsButton } from './open-submissions-button';
import { StartTournamentButton } from './start-tournament-button';

export default async function TournamentDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  const { slug } = await params;
  const trpc = await api();
  const tournamentDetails = await trpc.tournament.getBySlug({ slug });
  if (!tournamentDetails) {
    notFound();
  }
  const submissions = await trpc.submission.listByTournament({
    tournamentId: tournamentDetails.id,
  });
  if (tournamentDetails.status === 'draft')
    return (
      <div>
        <h1>{tournamentDetails.title}</h1>
        <p>{tournamentDetails.description}</p>
        <p>{tournamentDetails.category}</p>
        <p>{tournamentDetails.size}</p>
        {session?.user?.id === tournamentDetails.creatorId && (
          <OpenSubmissionsButton tournamentId={tournamentDetails.id} />
        )}
      </div>
    );

  if (tournamentDetails.status === 'accepting_submissions') {
    return (
      <div>
        <h1>{tournamentDetails.title}</h1>
        <p>{tournamentDetails.description}</p>
        <p>{tournamentDetails.category}</p>
        <p>{tournamentDetails.size}</p>
        <SubmissionForm tournamentId={tournamentDetails.id} />

        {submissions.map((submission) => (
          <div key={submission.id}>
            <div>{submission.title}</div>
            {submission.imageUrl && (
              <Image src={submission.imageUrl} alt={submission.title} />
            )}
          </div>
        ))}
        {session?.user?.id === tournamentDetails.creatorId && (
          <StartTournamentButton tournamentId={tournamentDetails.id} />
        )}
      </div>
    );
  }

  if (tournamentDetails.status === 'in_progress') {
    return (
      <div>
        <h3>Tournament in progress</h3>
      </div>
    );
  }
}
