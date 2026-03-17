import { initTRPC, TRPCError } from '@trpc/server';
import { db } from '@colosseum/db';
import superjson from 'superjson';

// Context — available to every procedure
// Updated Context type in packages/trpc/src/trpc.ts
export type Context = {
  db: typeof db;
  clientIp: string;
  session: {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  } | null;
  rateLimit?: {
    checkIp: (ip: string) => Promise<{ success: boolean }>;
    checkUser: (userId: string) => Promise<{ success: boolean }>;
  };
};

// Initialize tRPC with context and superjson transformer
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

// Base building blocks
export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (ctx.session === null) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});
