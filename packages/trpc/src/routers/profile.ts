import { router, publicProcedure, protectedProcedure } from '../trpc';
import { users, userRatings, tournaments, eq, desc } from '@colosseum/db';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const profileRouter = router({
  // Get current user's profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.session.user.id));

    if (!user) throw new TRPCError({ code: 'NOT_FOUND' });

    const ratings = await ctx.db
      .select()
      .from(userRatings)
      .where(eq(userRatings.userId, ctx.session.user.id))
      .orderBy(desc(userRatings.rating));

    const createdTournaments = await ctx.db
      .select()
      .from(tournaments)
      .where(eq(tournaments.creatorId, ctx.session.user.id))
      .orderBy(desc(tournaments.createdAt));

    return { user, ratings, createdTournaments };
  }),

  // Get any user's public profile by username
  getByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.username, input.username));

      if (!user) throw new TRPCError({ code: 'NOT_FOUND' });

      const ratings = await ctx.db
        .select()
        .from(userRatings)
        .where(eq(userRatings.userId, user.id))
        .orderBy(desc(userRatings.rating));

      return { user, ratings };
    }),
});
