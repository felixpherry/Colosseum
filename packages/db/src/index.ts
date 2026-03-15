import { db } from './client';

export * from './schema';
export { db } from './client';
export {
  eq,
  and,
  or,
  sql,
  desc,
  asc,
  isNotNull,
  isNull,
  lt,
  lte,
} from 'drizzle-orm';
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Transaction;
