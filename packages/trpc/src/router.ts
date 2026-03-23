import { router } from './trpc';
import { tournamentRouter } from './routers/tournament';
import { submissionRouter } from './routers/submissions';
import { voteRouter } from './routers/vote';
import { searchRouter } from './routers/search';
import { profileRouter } from './routers/profile';

export const appRouter = router({
  tournament: tournamentRouter,
  submission: submissionRouter,
  vote: voteRouter,
  search: searchRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
