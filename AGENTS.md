# Colosseum — Agent Context

Bracket tournament app where communities vote to crown a champion.
Users create tournaments, submit entries, vote head-to-head through
single-elimination brackets, and build ELO ratings per category.

## Role

You are a senior fullstack engineer working on Colosseum. Read this
entire file before every session. Update it when you discover gotchas,
conventions, or patterns during implementation.

## Stack

- Monorepo: Turborepo + pnpm workspaces
- Frontend: Next.js 16 (App Router, React Compiler enabled)
- API: tRPC (end-to-end type safety)
- Database: PostgreSQL (Supabase) + Drizzle ORM
- Job Queue: pg-boss (background workers inside Postgres)
- Cache/Rate Limiting: Redis (Upstash REST-based)
- Auth: Auth.js v5 (Google + GitHub OAuth, JWT sessions)
- Styling: Tailwind CSS v4 (CSS-first config) + ShadCN
- Forms: TanStack Form + Zod (shared schemas in @colosseum/types)
- Testing: Vitest (unit + integration)
- Fonts: Inter (UI) + JetBrains Mono (timers, code)

## Commands

```bash
pnpm dev              # Start Next.js dev server via Turborepo
pnpm build            # Build all packages (dependency order)
pnpm lint             # ESLint across all packages
pnpm format           # Prettier write
pnpm format:check     # Prettier check (CI)
pnpm test             # Vitest watch mode
pnpm test:run         # Vitest single run (CI)
pnpm db:push          # Push Drizzle schema to DB (dev only)
pnpm db:generate      # Generate migration files
pnpm db:migrate       # Run migrations
```

## Project Structure

```
apps/web/                        Next.js app (thin routing layer)
  src/
    app/(platform)/              Route group for authenticated pages
      tournaments/create/        Create tournament form
      tournaments/[slug]/        Tournament detail (all states)
    api/auth/[...nextauth]/      Auth.js catch-all route
    api/trpc/[trpc]/             tRPC HTTP handler
    globals.css                  Tailwind v4 tokens + ShadCN overrides
    layout.tsx                   Root layout (providers, fonts)
  components/                    Shared UI components
    countdown-timer.tsx          Timer with urgency tiers + variants
    global-ticker-provider.tsx   1Hz setInterval, single instance
    vote-card.tsx                Feed card with action stack
    theme-provider.tsx           next-themes wrapper
    ui/                          ShadCN generated components
  hooks/
    use-countdown.ts             Derives h/m/s from global tick
  lib/
    auth.ts                      Auth.js config (OAuth + JWT)
    ip-hash.ts                   HMAC-SHA256 IP hashing
    matchup.ts                   isVoteable() helper
    rate-limit.ts                Upstash rate limiters
    redis.ts                     Upstash Redis client
    utils.ts                     cn() utility
  trpc/
    client.ts                    createTRPCReact<AppRouter>
    context.ts                   Context factory (session + rate limit)
    provider.tsx                 TRPCProvider + QueryClient
    server.ts                    Server-side caller (no HTTP)
  types/
    matchup.ts                   ActiveMatchup type for feed cards

packages/db/                     Database layer
  src/
    client.ts                    Drizzle client (casing: snake_case)
    schema/                      One file per domain table
      auth.ts                    users, accounts
      tournaments.ts             tournaments (CHECK constraints, GIN FTS index)
      submissions.ts             submissions (unique per user per tournament)
      matchups.ts                matchups (6 CHECK constraints for state validity)
      votes.ts                   votes (immutable, survive user deletion)
      ratings.ts                 user_ratings (ELO per category)
      stats.ts                   tournament_stats (trending cache)
    index.ts                     Barrel export (schemas + db + drizzle helpers)
  drizzle.config.ts              Drizzle Kit config

packages/trpc/                   API layer
  src/
    trpc.ts                      tRPC init (context, public/protected procedures)
    router.ts                    Root router (merges domain routers)
    routers/
      tournament.ts              CRUD + state transitions + listMatchups
      submission.ts              Submit + list by tournament
      vote.ts                    Cast vote (transactional, rate-limited)
      search.ts                  FTS search + trending feed
    services/
      bracket.ts                 insertBracket, advanceByes, activateReadyMatchups
      resolve.ts                 resolveMatchup (winner + ELO + advancement)
      worker.ts                  pg-boss singleton
      cron.ts                    Cron jobs (close-expired, refresh-trending)
      trending.ts                HN gravity formula refresh

packages/lib/                    Pure utilities
  src/
    slug.ts                      generateSlug (sanitize + random suffix)
    tournament.ts                calculateTotalRounds
    bracket.ts                   generateSeedOrder, calculateBracketSize, generateBracketData
    elo.ts                       getKFactor, calculateExpectedScore, calculateNewRatings

packages/types/                  Shared Zod schemas + inferred types
  src/schemas/
    tournament.ts                createTournamentSchema + CreateTournamentInput
    submission.ts                createSubmissionSchema + CreateSubmissionInput

packages/ui/                     Shared ShadCN component library (placeholder)
packages/config/                 Shared config (placeholder)
```

## Package Boundary Rules

1. apps/web NEVER exports. Other packages NEVER import from apps/web.
2. packages/ can import from other packages/ via workspace:* deps.
3. All Drizzle imports (eq, and, sql, etc.) come from @colosseum/db, not drizzle-orm directly.
4. Zod schemas shared between tRPC and web live in @colosseum/types.
5. Domain services (bracket, resolve, trending) live in packages/trpc/src/services/.
6. Pure functions (slug, ELO, bracket generation) live in packages/lib/.
7. Rate limiting and auth config live in apps/web (framework-coupled).
8. Rate limit functions are injected into tRPC context, not imported by packages/trpc.

## Hard Rules (never break)

1. Database constraints are the source of truth. UNIQUE, CHECK, FK cascades
   enforce invariants — application code is a second layer, not the only layer.
2. Votes are immutable. No UPDATE or DELETE on the votes table by users.
3. Vote counts (votesA/votesB) on matchups are denormalized caches.
   The votes table is the source of truth.
4. snake_case in DB, camelCase in TypeScript. Drizzle handles conversion
   via casing: "snake_case" in client.ts. Never manually map column names.
5. Every multi-write operation uses a database transaction.
6. FOR UPDATE row locks on matchup reads inside vote and resolve transactions.
7. Matchup advancement uses IS NULL guard for idempotency:
   UPDATE ... SET entry_a_id = $winner WHERE entry_a_id IS NULL
8. Background workers resolve matchups, not user requests.
9. No raw IPs stored. HMAC-SHA256 with daily rotating salt.
10. No `any` type. Use `unknown` with type guards or proper types.
11. Co-located test files: x.test.ts next to x.ts.
12. Conventional commits: feat:, fix:, chore:, refactor:, docs:, test:

## Domain Knowledge

### Tournament Status State Machine
Only these transitions are valid:
  draft → accepting_submissions → in_progress → completed
  draft → cancelled
  accepting_submissions → cancelled
  in_progress stays until all matchups resolve (no manual cancel)

### Matchup Statuses
pending (empty or partially filled, waiting for entries)
active (both entries present, voting open, timer running)
completed (winner determined, votes tallied)
bye (one entry, auto-win, no voting)
cancelled

### Bracket Pipeline (4 steps, in order)
1. generateBracketData() — pure function, returns MatchupData[]
2. insertBracket(tx, tournamentId, data) — batch INSERT, status → in_progress
3. advanceByes(tx, tournamentId) — UPDATE existing round 2 matchups with BYE winners
4. activateReadyMatchups(tx, tournamentId, durationHours) — activate matchups with both entries

### Vote Cast Flow (8 steps, single transaction)
1. Rate limit check (Redis, before transaction)
2. Open transaction
3. SELECT ... FOR UPDATE on matchup row
4. Verify status = active AND closesAt > now
5. Verify both entries exist (defense-in-depth)
6. Determine side (entryA or entryB)
7. INSERT vote (UNIQUE constraint catches duplicates → CONFLICT)
8. Atomic increment: SET votesA = votesA + 1 (column reference, not JS variable)

### Matchup Resolution
- pg-boss cron (every 60s) finds expired active matchups
- Enqueues individual resolve-matchup jobs (singletonKey = matchupId)
- Worker: lock row → determine winner → mark completed → update ELO → advance winner → activate next
- Winner: most votes, or seed tiebreak (lower seed number wins)
- ELO: variable K-factor (40 for ≤10 matches, 20 for 11+)
- Finals: crown champion, set tournament to completed

### Trending Formula (Hacker News gravity)
score = votes_24h / (age_hours + 2)^1.5
Refreshed every 5 minutes by pg-boss job.

## Gotchas (discovered during implementation)

1. React Compiler removes unused deps from useMemo. The global ticker
   pattern (useTick() as re-render trigger) requires `void tick` or
   removing useMemo entirely. We chose removing useMemo — the React
   Compiler handles caching automatically.

2. Supabase direct connection requires IPv6. Use Session Pooler
   (port 5432) for drizzle-kit push/migrate if on IPv4-only network.

3. pnpm workspaces + create-next-app: delete any nested
   pnpm-workspace.yaml or .git inside apps/web after scaffolding.

4. Drizzle casing: "snake_case" must be set in BOTH client.ts (runtime)
   AND drizzle.config.ts (CLI). Mismatch = migrations don't match queries.

5. ShadCN components generate @/lib/utils imports. Verify cn() import
   path matches your project structure after each `shadcn add`.

6. Auth.js v5 types session.user.id as string | undefined. Narrow with
   session?.user?.id before using in tRPC context.

7. Postgres enums are painful to migrate (can't remove/rename values).
   Use text + CHECK constraint for columns whose values might evolve.

8. SELECT ... FOR UPDATE with Drizzle: use .for('update') method.

9. Tailwind v4: no tailwind.config.ts. All config in CSS via @theme {}.
   @custom-variant for dark mode. @source for monorepo package scanning.

10. TanStack Form + Zod: .default() in Zod changes the input type to
    accept undefined, which conflicts with form defaultValues. Keep
    .default() out of shared schemas — set defaults in form config.

11. DbOrTx type: services that run both standalone and inside transactions
    need a union type. Export from @colosseum/db:
    type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
    type DbOrTx = typeof db | Transaction;

12. next/router vs next/navigation: App Router uses next/navigation.
    next/router is Pages Router only. Will crash at runtime if wrong.

## File References

- Architecture doc: docs/architecture.md
- Decisions log: docs/decisions.md
- Implementation tracker: docs/implementation/v1.0-mvp.md
