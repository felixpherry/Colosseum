'use client';

import { Button } from '@/components/ui/button';
import { trpc } from '@/trpc/client';
import { useRouter } from 'next/navigation';

export function StartTournamentButton({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const router = useRouter();
  const { mutate } = trpc.tournament.startTournament.useMutation();
  return (
    <Button
      onClick={() => {
        mutate(
          {
            tournamentId,
          },
          {
            onSuccess: () => {
              router.refresh();
            },
          },
        );
      }}
    >
      Start tournament
    </Button>
  );
}
