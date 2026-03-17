import { router, protectedProcedure } from '../trpc';
import { matchups, votes, eq, sql } from '@colosseum/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const voteRouter = router({
  cast: protectedProcedure
    .input(
      z.object({
        matchupId: z.string(),
        submissionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.rateLimit) {
        const ipCheck = await ctx.rateLimit.checkIp(ctx.clientIp);
        if (!ipCheck.success) {
          throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
        }

        const userCheck = await ctx.rateLimit.checkUser(ctx.session.user.id);
        if (!userCheck.success) {
          throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
        }
      }

      return await ctx.db.transaction(async (tx) => {
        const results = await tx
          .select()
          .from(matchups)
          .where(eq(matchups.id, input.matchupId))
          .for('update');

        if (!results[0]) {
          throw new TRPCError({
            code: 'NOT_FOUND',
          });
        }

        const matchup = results[0];
        const now = new Date();
        if (
          matchup.status !== 'active' ||
          (matchup.closesAt && matchup.closesAt <= now)
        ) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
          });
        }

        if (!matchup.entryAId || !matchup.entryBId) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
          });
        }
        if (
          input.submissionId !== matchup.entryAId &&
          input.submissionId !== matchup.entryBId
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
          });
        }

        const isEntryA = input.submissionId === matchup.entryAId;
        try {
          await tx.insert(votes).values({
            matchupId: input.matchupId,
            userId: ctx.session.user.id,
            submissionId: input.submissionId,
          });
        } catch (err) {
          if (
            err instanceof Error &&
            err.message.includes('unique constraint')
          ) {
            throw new TRPCError({
              code: 'CONFLICT',
            });
          } else {
            throw err;
          }
        }
        const updatedMatchups = await tx
          .update(matchups)
          .set({
            ...(isEntryA
              ? { votesA: sql`${matchups.votesA} + 1` }
              : { votesB: sql`${matchups.votesB} + 1` }),
          })
          .where(eq(matchups.id, input.matchupId))
          .returning();
        if (!updatedMatchups[0]) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
          });
        }
        const updatedMatchup = updatedMatchups[0];
        return isEntryA ? updatedMatchup.votesA : updatedMatchup.votesB;
      });
    }),
});
