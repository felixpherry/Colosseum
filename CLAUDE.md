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
- Auth: Auth.js v5 (Google + GitHub OAuth, JWT sessions)
- Validation: Zod (input validation on tRPC procedures)
- Testing: Vitest (unit + integration), Playwright (E2E)

## Project Structure

```
apps/web/                      → Next.js app (thin routing layer)
  src/lib/auth.ts              → Auth.js config (OAuth, callbacks)
  src/trpc/                    → tRPC client, provider, server caller, context
  src/app/api/auth/            → Auth.js route handler
  src/app/api/trpc/            → tRPC HTTP handler
  src/middleware.ts             → Route protection

packages/db/                   → Drizzle schema, migrations, database client
  src/client.ts                → DB connection (casing: "snake_case")
  src/schema/                  → Schema files per domain

packages/trpc/                 → tRPC routers and procedures
  src/trpc.ts                  → tRPC init, context, publicProcedure, protectedProcedure
  src/router.ts                → Root router (merges all domain routers)
  src/routers/tournament.ts    → Tournament CRUD + state transitions
  src/routers/submission.ts    → Submit entries, list by tournament
  src/routers/vote.ts          → Vote cast (transactional, locked, atomic)
  src/services/bracket.ts      → insertBracket, advanceByes, activateReadyMatchups
  src/services/resolve.ts      → resolveMatchup (winner determination, ELO, advancement)
  src/services/cron.ts         → pg-boss cron jobs (close-expired-matchups, resolve-matchup)
  src/services/worker.ts       → pg-boss initialization

packages/lib/                  → Shared utilities
  src/slug.ts                  → generateSlug (URL-friendly tournament slugs)
  src/tournament.ts            → calculateTotalRounds
  src/bracket.ts               → generateSeedOrder, calculateBracketSize, generateBracketData
  src/elo.ts                   → calculateExpectedScore, calculateNewRatings, getKFactor

packages/features/             → Domain logic + UI per feature (not yet populated)
packages/ui/                   → Shared ShadCN component library (not yet populated)
packages/types/                → Shared TypeScript types (not yet populated)
```

## Key Conventions

- Database columns: snake_case (handled by Drizzle `casing: "snake_case"`)
- TypeScript: camelCase everywhere in app code
- Conversion happens automatically at the Drizzle boundary
- All database constraints (uniqueness, valid states) enforced at DB level via CHECK constraints
- Thin route pages in apps/web — domain logic lives in packages/
- Internal packages point `main` and `exports` at raw .ts source (no build step)
- Workspace dependencies use `"workspace:*"` in package.json
- Conventional commits: feat:, fix:, chore:, refactor:, docs:, test:

## Database Schema

- **users / accounts**: Auth (OAuth only, no passwords). Accounts store provider links, not sessions.
- **tournaments**: Container with status state machine
  (draft → accepting_submissions → in_progress → completed/cancelled).
  Cancel only allowed from draft or accepting_submissions.
- **submissions**: Entries in a tournament (one per user per tournament, UNIQUE constraint).
  submitterId uses SET NULL on user deletion (submissions survive).
- **matchups**: Head-to-head battles with bracket position (round, position), vote counts,
  6 CHECK constraints enforcing state-dependent validity (active must have entries/times,
  bye must have winner and no entryB). 0-indexed positions.
- **votes**: Immutable vote records (survive user deletion via SET NULL on userId).
  UNIQUE(matchupId, userId) prevents double voting.
- **user_ratings**: ELO per user per category (default 1200, variable K-factor: 40 for ≤10 matches, 20 after).
- **tournament_stats**: Pre-computed trending data (refreshed by pg-boss every 5 min).

## Critical Invariants

- One submission per user per tournament (DB UNIQUE constraint)
- One vote per user per matchup (DB UNIQUE constraint, NULL-safe for deleted users)
- Votes are immutable — no updates, no deletes by users
- Vote counts on matchups (votesA/votesB) are denormalized caches — votes table is source of truth
- Vote cast uses SELECT ... FOR UPDATE + transaction (8-step atomic procedure)
- Matchup resolution happens via pg-boss background workers, not user requests
- Active matchups MUST have both entries, both seeds, activation and closing times (CHECK constraints)
- advanceWinner uses AND entry_x_id IS NULL for idempotent slot filling (race-safe)
- Bracket positions are 0-indexed. nextPosition = Math.floor(currentPosition / 2)
- Even positions fill entryA slot, odd positions fill entryB slot
- ELO updates happen inside the resolution transaction, before advancement
- ELO is skipped for deleted users (null submitterId)
- Bracket auto-shrinks to smallest valid power of 2 >= entry count (min 3 entries)

## Background Jobs (pg-boss)

- **close-expired-matchups**: Cron every 60s. Finds active matchups past closesAt, enqueues resolve-matchup jobs.
- **resolve-matchup**: Processes one matchup. Locks row, determines winner (votes or seed tiebreak),
  marks completed, updates ELO, advances winner to next round, activates ready matchups,
  checks tournament completion. Uses singletonKey for deduplication.

## Bracket Pipeline

```
generateBracketData()     → Pure function: seeds, BYEs, empty future rounds
insertBracket()           → Transaction: insert all matchups, set tournament in_progress
advanceByes()             → Update: place BYE winners into next round slots
activateReadyMatchups()   → Update: activate any pending matchup with both entries filled
```

## Type Patterns

- `DbOrTx` type (exported from @colosseum/db): union of db client and transaction, used in all service functions
- `matchups.$inferSelect`: Drizzle's inferred row type for SELECT results
- Module augmentation for next-auth Session type (adds user.id)

## Commands

- `pnpm dev`          → start dev server
- `pnpm build`        → build all packages
- `pnpm lint`         → lint all packages
- `pnpm format`       → format with prettier
- `pnpm test`         → run tests in watch mode
- `pnpm test:run`     → run tests once (CI)
- `pnpm db:push`      → push schema to database (dev only)
- `pnpm db:generate`  → generate migration files
- `pnpm db:migrate`   → run migrations
