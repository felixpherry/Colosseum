import { router, publicProcedure, protectedProcedure } from '../trpc';
import { eq, submissions, tournaments } from '@colosseum/db';
import { z } from 'zod';
import { calculateTotalRounds, generateSlug } from '@colosseum/lib';
import { TRPCError } from '@trpc/server';
import { generateBracketData } from '../../../lib/src/bracket';
import {
  activateReadyMatchups,
  advanceByes,
  insertBracket,
} from '../services/bracket';

export const tournamentRouter = router({
  // Anyone can list tournaments
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(tournaments);
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const results = await ctx.db
        .select()
        .from(tournaments)
        .where(eq(tournaments.slug, input.slug));
      if (!results[0]) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return results[0];
    }),

  listByCategory: publicProcedure
    .input(z.object({ category: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select()
        .from(tournaments)
        .where(
          input.category ? eq(tournaments.category, input.category) : undefined,
        );
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
    .mutation(async ({ input, ctx }) => {
      const slug = generateSlug(input.title);
      const totalRounds = calculateTotalRounds(input.size);
      return await ctx.db
        .insert(tournaments)
        .values({
          ...input,
          slug,
          totalRounds,
          creatorId: ctx.session.user.id,
        })
        .returning();
    }),

  getMyTournaments: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select()
      .from(tournaments)
      .where(eq(tournaments.creatorId, ctx.session.user.id));
  }),

  openSubmissions: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
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
      if (tournament.creatorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
        });
      }
      if (tournament.status !== 'draft') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
        });
      }

      return await ctx.db
        .update(tournaments)
        .set({
          status: 'accepting_submissions',
        })
        .where(eq(tournaments.id, input.tournamentId))
        .returning();
    }),

  cancel: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
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

      if (tournament.creatorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
        });
      }

      if (
        tournament.status !== 'draft' &&
        tournament.status !== 'accepting_submissions'
      ) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
        });
      }

      return ctx.db
        .update(tournaments)
        .set({
          status: 'cancelled',
        })
        .where(eq(tournaments.id, input.tournamentId))
        .returning();
    }),

  startTournament: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
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
      if (tournament.creatorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
        });
      }

      if (tournament.status !== 'accepting_submissions') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
        });
      }

      const submissionEntries = await ctx.db
        .select()
        .from(submissions)
        .where(eq(submissions.tournamentId, input.tournamentId));

      if (submissionEntries.length < 3) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Submission entries must be greater than 2',
        });
      }

      const bracketData = generateBracketData(
        submissionEntries,
        tournament.size,
      );
      const insertedMatchups = await insertBracket(
        ctx.db,
        tournament.id,
        bracketData,
      );
      await advanceByes(ctx.db, tournament.id);
      await activateReadyMatchups(
        ctx.db,
        tournament.id,
        tournament.matchupDurationHours,
      );
      return insertedMatchups;
    }),
});
