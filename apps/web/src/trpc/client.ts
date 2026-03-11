import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@colosseum/trpc';

export const trpc = createTRPCReact<AppRouter>();
