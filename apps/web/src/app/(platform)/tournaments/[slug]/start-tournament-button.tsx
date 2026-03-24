'use client';

import { Button } from '@/components/ui/button';
import { trpc } from '@/trpc/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function StartTournamentButton({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const router = useRouter();
  const { mutate, isPending } = trpc.tournament.startTournament.useMutation();

  return (
    <Button
      disabled={isPending}
      onClick={() =>
        mutate(
          { tournamentId },
          {
            onSuccess: () => {
              toast.success('Tournament started! Bracket generated.');
              router.refresh();
            },
            onError: (err) => {
              if (err.data?.code === 'PRECONDITION_FAILED') {
                toast.error(err.message || 'Not enough entries to start.');
              } else {
                toast.error('Failed to start tournament.');
              }
            },
          },
        )
      }
    >
      {isPending ? 'Starting...' : 'Start Tournament'}
    </Button>
  );
}
