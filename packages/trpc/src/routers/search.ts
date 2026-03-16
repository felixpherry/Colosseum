import z from 'zod';
import { publicProcedure, router } from '../trpc';
import { sql } from '@colosseum/db';

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  status: string;
  rank: number;
};

export const searchRouter = router({
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const results = await ctx.db.execute<SearchResult>(sql`
        SELECT
            id, title, slug, description, category, status,
            ts_rank(
                setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
                setweight(to_tsvector('english', coalesce(category, '')), 'C'),
                websearch_to_tsquery('english', ${input.query})
            ) AS rank
        FROM tournaments
        WHERE (
            setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(category, '')), 'C')
        ) @@ websearch_to_tsquery('english', ${input.query})
        ORDER BY rank DESC
        LIMIT ${input.limit}
    `);
      return results;
    }),
});
