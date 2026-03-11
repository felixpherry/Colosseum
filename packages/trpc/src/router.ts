import { router } from './trpc';
import { tournamentRouter } from './routers/tournament';

export const appRouter = router({
  tournament: tournamentRouter,
});

export type AppRouter = typeof appRouter;
