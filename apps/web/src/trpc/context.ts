import { auth } from '@/lib/auth';
import { db } from '@colosseum/db';
import type { Context } from '@colosseum/trpc';

export async function createContext(): Promise<Context> {
  const session = await auth();

  return {
    db,
    session: session?.user?.id
      ? {
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
          },
        }
      : null,
  };
}
