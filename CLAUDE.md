# Colosseum

Bracket tournament app where communities vote to crown a champion.
Users create tournaments, submit entries, vote head-to-head through
single-elimination brackets, and build ELO ratings per category.

## Tech Stack

- Monorepo: Turborepo + pnpm workspaces
- Frontend: Next.js 16 (App Router, Server Components)
- API: tRPC (end-to-end type safety)
- Database: PostgreSQL (Supabase) + Drizzle ORM
- Job Queue: pg-boss (background workers)
- Cache/Rate Limiting: Redis (Upstash)
- Auth: Auth.js v5 (Google + GitHub OAuth)

## Project Structure

apps/web/ → Next.js app (thin routing layer, composes features)
packages/db/ → Drizzle schema, migrations, database client
packages/trpc/ → tRPC routers and procedures
packages/features/ → Domain logic + UI per feature
packages/ui/ → Shared ShadCN component library
packages/lib/ → Shared utilities (slug gen, ELO calc, etc.)
packages/types/ → Shared TypeScript types

## Key Conventions

- Database columns: snake_case (handled by Drizzle casing: "snake_case")
- TypeScript: camelCase everywhere in app code
- Conversion happens automatically at the Drizzle boundary
- All database constraints (uniqueness, valid states) are enforced
  at the DB level via CHECK constraints, not just app code
- Thin route pages in apps/web — domain logic lives in packages/features/

## Database Schema

- users / accounts: Auth (OAuth only, no passwords)
- tournaments: Container with status state machine
  (draft → accepting_submissions → in_progress → completed/cancelled)
- submissions: Entries in a tournament (one per user per tournament)
- matchups: Head-to-head battles with bracket position, vote counts,
  6 CHECK constraints enforcing state-dependent validity
- votes: Immutable vote records (survive user deletion via SET NULL)
- user_ratings: ELO per user per category (default 1200)
- tournament_stats: Pre-computed trending data (refreshed by pg-boss)

## Critical Invariants

- One submission per user per tournament (DB UNIQUE constraint)
- One vote per user per matchup (DB UNIQUE constraint)
- Votes are immutable — no updates, no deletes by users
- Vote counts on matchups (votesA/votesB) are denormalized caches
  of the votes table — votes table is source of truth
- Matchup resolution happens via background workers, not user requests
- Active matchups MUST have both entries, both seeds, activation
  and closing times (enforced by CHECK constraints)

## Commands

- pnpm dev → start dev server
- pnpm build → build all packages
- pnpm lint → lint all packages
- pnpm format → format with prettier
- pnpm db:push → push schema to database (dev only)
- pnpm db:generate → generate migration files
- pnpm db:migrate → run migrations
