'use client';

import { Button } from '@/components/ui/button';
import { trpc } from '@/trpc/client';
import { useRouter } from 'next/navigation';

export function OpenSubmissionsButton({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const { mutate } = trpc.tournament.openSubmissions.useMutation();
  const router = useRouter();
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
      Open Submissions
    </Button>
  );
}
