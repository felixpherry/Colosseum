import { router, publicProcedure, protectedProcedure } from '../trpc';
import { tournaments } from '@colosseum/db';
import { z } from 'zod';

export const tournamentRouter = router({
  // Anyone can list tournaments
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(tournaments);
  }),

  // Only logged-in users can create
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(100),
        description: z.string().max(500).optional(),
        category: z.string().min(1),
        size: z.union([
          z.literal(8),
          z.literal(16),
          z.literal(32),
          z.literal(64),
        ]),
        matchupDurationHours: z.number().min(1).max(48).default(24),
      }),
    )
    .mutation(async () => {
      // We'll implement this properly later
      // For now, just a placeholder to test the wiring
      return { success: true };
    }),
});
