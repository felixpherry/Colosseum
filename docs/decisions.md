# Decisions Log

Append-only record of implementation decisions. Records "how" not "what."

---

### 2026-03-23 — text + CHECK over pgEnum for status columns
Considered pgEnum for tournament.status and matchup.status. Rejected because
Postgres enums are append-only — you can add values but never remove or rename
them without recreating the type. text + CHECK constraint allows any migration
with a simple DROP/ADD CONSTRAINT. TypeScript union types provide compile-time
safety regardless.

### 2026-03-23 — Drizzle casing: "snake_case" over manual column name strings
Drizzle supports automatic snake_case mapping via `casing: "snake_case"` in both
the client and drizzle.config.ts. This eliminates manual `uuid("user_id")` strings
on every column. Must be set in both places or migrations won't match runtime queries.

### 2026-03-23 — Re-export drizzle-orm helpers from @colosseum/db (Option B)
Considered: (A) install drizzle-orm in apps/web, (B) re-export from @colosseum/db,
(C) peer dependency. Chose B because drizzle-orm is an implementation detail of the
db package. Consumers import { eq, and, sql } from "@colosseum/db" and never need
to know which ORM is underneath.

### 2026-03-23 — JWT sessions over database sessions for V1
Auth.js supports both. JWT sessions are stateless — no DB/Redis lookup per request.
Tradeoff: can't revoke sessions instantly. For V1 this is acceptable. Switch to
database sessions + Redis is a clean upgrade path for V2 if needed.

### 2026-03-23 — Custom Auth.js signIn callback over default Drizzle adapter
The default adapter expects its own table schema. Custom callback gives full control
over our schema (users + accounts tables). User + account creation wrapped in a
transaction to prevent orphaned users on partial failure.

### 2026-03-23 — submissions.submitterId uses SET NULL on delete, not CASCADE
CASCADE would delete submissions when a user deletes their account, breaking
in-progress tournament brackets. SET NULL preserves the submission as a
"[deleted user]" entry. Same principle as votes.userId.

### 2026-03-23 — Vote counts as denormalized cache (votesA/votesB on matchups)
Considered: (A) COUNT from votes table on every read, (B) Redis counters,
(C) denormalized columns. Chose C because it's a single atomic SQL increment
inside the vote transaction. Reads are instant (no JOIN/COUNT). If counters
drift, a rebuild script recomputes from the votes table.

### 2026-03-23 — pg-boss over BullMQ/Redis for job queue
pg-boss uses the existing Postgres database. No additional infrastructure.
Uses SELECT ... FOR UPDATE SKIP LOCKED for exactly-once delivery — same
patterns as our vote/resolve transactions. One database to manage, backup,
and monitor.

### 2026-03-23 — Fan-out pattern for matchup resolution
One cron job (close-expired-matchups) dispatches individual resolve-matchup
jobs. Each job is independent — can fail, retry, and complete without
affecting others. singletonKey prevents duplicate jobs per matchup.

### 2026-03-23 — Postgres FTS over Elasticsearch for V1 search
Built-in tsvector + GIN index handles weighted search across title,
description, category. No external service. Sufficient for <1M tournaments.
Elasticsearch becomes relevant when needing typo tolerance, faceted search,
or billion-row scale.

### 2026-03-23 — Full trending recompute over incremental counters
Single SQL query (INSERT ... SELECT ... ON CONFLICT DO UPDATE) recomputes
all trending scores every 5 minutes. Simple, correct, handles 10K+ tournaments.
Incremental counters are a V2 optimization when vote volume makes the JOIN expensive.

### 2026-03-23 — Rate limit functions injected via tRPC context (dependency inversion)
Rate limiters live in apps/web (framework-coupled to Upstash). tRPC procedures
receive them through context as `checkIp`/`checkUser` functions. packages/trpc
never imports from apps/web. If rate limiter changes, only context.ts changes.

### 2026-03-23 — Shared Zod schemas in packages/types over inline definitions
TanStack Form and tRPC procedures both need the same validation. Single schema
in @colosseum/types is the source of truth. Removed .default() from shared schemas
because it changes Zod's input type to accept undefined, conflicting with form
defaultValues that always provide a value.

### 2026-03-23 — Removed useMemo from useCountdown (React Compiler compatibility)
React Compiler's static analysis removes unused dependencies from useMemo.
The global ticker pattern uses `tick` as a re-render trigger without reading its
value — the compiler optimizes it out. Removing useMemo lets the compiler handle
caching automatically and eliminates the conflict.

### 2026-03-23 — Auto-shrink bracket size instead of rejecting insufficient entries
If creator sets size=64 but only 20 entries submit, auto-shrink to 32 (smallest
power of 2 >= entries). Better UX than forcing creator to change settings or wait.
Minimum 3 entries enforced to prevent degenerate brackets.
