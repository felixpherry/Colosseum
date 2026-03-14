import { router } from './trpc';
import { tournamentRouter } from './routers/tournament';
import { submissionRouter } from './routers/submissions';

export const appRouter = router({
  tournament: tournamentRouter,
  submission: submissionRouter,
});

export type AppRouter = typeof appRouter;
