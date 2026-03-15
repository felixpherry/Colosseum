import { router } from './trpc';
import { tournamentRouter } from './routers/tournament';
import { submissionRouter } from './routers/submissions';
import { voteRouter } from './routers/vote';

export const appRouter = router({
  tournament: tournamentRouter,
  submission: submissionRouter,
  vote: voteRouter,
});

export type AppRouter = typeof appRouter;
