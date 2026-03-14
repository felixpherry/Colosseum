import z from 'zod';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { eq, submissions, tournaments } from '@colosseum/db';
import { TRPCError } from '@trpc/server';

export const submissionRouter = router({
  submit: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(150),
        tournamentId: z.string(),
        imageUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const results = await ctx.db
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, input.tournamentId));
      if (!results[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
        });
      }

      const tournament = results[0];
      if (tournament.status !== 'accepting_submissions') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
        });
      }

      const submission = await ctx.db
        .insert(submissions)
        .values({
          ...input,
          submitterId: ctx.session.user.id,
        })
        .onConflictDoNothing()
        .returning();

      if (!submission[0]) {
        throw new TRPCError({
          code: 'CONFLICT',
        });
      }
      return submission[0];
    }),

  listByTournament: publicProcedure
    .input(
      z.object({
        tournamentId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await ctx.db
        .select()
        .from(submissions)
        .where(eq(submissions.tournamentId, input.tournamentId));
    }),
});
