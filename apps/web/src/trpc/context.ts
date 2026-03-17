import { auth } from '@/lib/auth';
import { hashIp } from '@/lib/ip-hash';
import { ipRateLimit, userRateLimit } from '@/lib/rate-limiter';
import { db } from '@colosseum/db';
import type { Context } from '@colosseum/trpc';
import { headers } from 'next/headers';

export async function createContext(): Promise<Context> {
  const session = await auth();
  const headersList = await headers();
  const clientIp =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  return {
    db,
    clientIp,
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
    rateLimit: {
      checkIp: async (ip: string) => ipRateLimit.limit(hashIp(ip)),
      checkUser: async (userId: string) => userRateLimit.limit(userId),
    },
  };
}
