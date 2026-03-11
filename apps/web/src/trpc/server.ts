import 'server-only';
import { createCallerFactory } from '@colosseum/trpc';
import { appRouter } from '@colosseum/trpc';
import { createContext } from './context';

const createCaller = createCallerFactory(appRouter);

export async function api() {
  const context = await createContext();
  return createCaller(context);
}
