# Project Backlog: Shopfront (MCP & Web Local Business Directory)

## Sprint Overview

| Sprint | Milestone Reference | Focus Area | Status | Target Deliverable |
| :--- | :--- | :--- | :--- | :--- |
| **Sprint 0** | **M0: Decisions & Spikes** | Scaffolding, Strict Tooling & Config | `[x] COMPLETED` | Pinned `package.json`, TypeScript `strict: true`, Vitest, ESLint, `docs/jev-api-notes.md` |
| **Sprint 1** | **M1: Database & Domain** | Postgres Schema, Seeds & Pure Domain Modules | `[x] COMPLETED` | `0001_initial_schema.sql`, migration runner, 32 localities seed, pure domain modules (`text`, `localities`, `pricing`, `hours`, `action-links`) + unit tests |
| **Sprint 2** | **M2: Auth & Admin Portal** | Authentication, Sessions, Lockout & Admin UI | `[ ] TODO` | Argon2id auth, timing-safe login, CSRF origin guard, lockout, `create-admin` CLI, `/admin` routes (A1–A9), audit log |
| **Sprint 3** | **M3: Owner Portal** | Owner Dashboard, Menu & Hours Management | `[ ] TODO` | First login forced password change (O1), `/owner` routes (O1–O9), D13 invariant, 100-item limit, IDOR protection |
| **Sprint 4** | **M4: Search Stage 1 & MCP Server** | PostGIS Pipeline & Stateless MCP Tools | `[ ] TODO` | Stage 1 SQL (H1–H5), H6 `open_now` filter, relaxation hints, `POST /mcp` stateless transport, 5 MCP tools, search telemetry |
| **Sprint 5** | **M5: Stage 2 Reranker & Eval** | Jev API Reranking & Offline Benchmark | `[ ] TODO` | Parallel Jev client, fail-open fallback, 40 benchmark queries, labels, `NDCG@5`/`MRR@5`/`Recall@10`/bootstrap CI harness, prompt-injection test |
| **Sprint 6** | **M6: Public Web & Operations** | Public Search UI, Docker & E2E Tests | `[ ] TODO` | Web search page (`/`), shop detail (`/shop/[slug]`), `/api/health`, Docker Compose, purge-logs cron, Playwright full lifecycle suite |
| **Sprint 7** | **M7: Pilot, Packaging & Launch** | Onboarding Real Shops & Documentation | `[ ] TODO` | `pilot-log.md` (10 real Chennai shops), `README.md` with Claude Desktop config, verified launch checklist |

---

## Sprint 0: Foundation, Scaffolding & Frozen Spikes (M0)

### SPRINT-0.1: Repository Scaffolding & Pinned Dependencies
- **Status:** `[x] DONE`
- **Scope:** Create `package.json` with exact pinned dependencies (Next.js App Router, `@modelcontextprotocol/sdk` v1.x, `zod`, `pg`, `argon2`, `vitest`, `@playwright/test`, `typescript`). Configure `tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess: true`. Setup `vitest.config.ts` and `next.config.mjs` with security headers.
- **Acceptance Criteria:**
  - `npm test` runs cleanly.
  - `npm run typecheck` and `npm run lint` pass.
  - Zero unpinned (`^`, `~`) dependencies in `package.json`.
- **Completion Details:**
  - Exact pinned versions in `package.json`: Next.js 15.5.28, @modelcontextprotocol/sdk 1.32.1, zod 3.25.76, argon2 0.45.1, pg 8.23.1, vitest 3.2.7, typescript 5.8.3, playwright 1.64.1.
  - Strict compiler and security configs created (`tsconfig.json`, `vitest.config.ts`, `next.config.mjs`, `eslint.config.mjs`).
  - Baseline Next.js shell files created in `src/app/` (`layout.tsx`, `page.tsx`).
  - Unit test verification test passed.

### SPRINT-0.2: Configuration & Environment Module (`src/config.ts`)
- **Status:** `[x] DONE`
- **Scope:** Implement Zod-validated environment config in `src/config.ts` validating all variables listed in PRD Section 15.
- **Acceptance Criteria:**
  - Missing required variable aborts process with descriptive error.
  - Valid defaults populated for timeouts, limits, and boolean flags.
  - Unit tests verify boundary parsing.
- **Completion Details:**
  - Created `src/config.ts` with Zod schema covering all 17 environment variables and Chennai service area bounding box constants (`12.75 <= lat <= 13.30`, `79.95 <= lng <= 80.40`).
  - Unit tests in `tests/unit/config.test.ts` verify defaults, overrides, missing variable aborts, and constants.
  - Verification triumvirate passed (Vitest + typecheck + lint).

### SPRINT-0.3: Jev API Contract & Latency Spike Documentation (`docs/jev-api-notes.md`)
- **Status:** `[x] DONE`
- **Scope:** Author `docs/jev-api-notes.md` freezing the Jev Decisions API request payload schema, scoring levels (0–3), probability distribution rules, and timeout parameters.
- **Acceptance Criteria:**
  - Schema documentation matches D6, D14, D17 requirements.
- **Completion Details:**
  - Authored `docs/jev-api-notes.md` freezing endpoint, headers, prompt-injection truncation rules (Section 12.3), schema validation rules, expected score computation, tie-breaking, latency budgets (450ms Jev timeout / 700ms total budget), and offline evaluation cache contract.

---

## Sprint 1: Database Architecture, Migrations & Pure Domain (M1)

### SPRINT-1.1: Migration Runner & Initial Schema (`db/migrations/0001_initial_schema.sql`, `scripts/migrate.ts`)
- **Status:** `[x] DONE`
- **Scope:** Create `scripts/migrate.ts` supporting transactional execution and `schema_migrations` tracking. Author authoritative DDL `0001_initial_schema.sql` (PostGIS, pg_trgm, pgcrypto, all 10 tables, triggers, and indices).
- **Acceptance Criteria:**
  - `npm run migrate` runs idempotently on fresh Postgres container.
  - PostGIS geography spatial indices and trigram GIN indices created successfully.
- **Completion Details:**
  - Configured `docker-compose.yml` with `postgis/postgis:16-3.4` container.
  - Authored authoritative DDL `db/migrations/0001_initial_schema.sql` creating PostGIS, pg_trgm, pgcrypto, 8 ENUM types, 10 primary tables, updated_at triggers, search_text triggers, GIST spatial index, GIN trigram indices, and FTS GIN indices.
  - Created `scripts/migrate.ts` with transactional migration runner and `schema_migrations` tracking. Tested idempotency against live container.

### SPRINT-1.2: Database Pool & Statement Timeout Wrapper (`src/db.ts`)
- **Status:** `[x] DONE`
- **Scope:** Singleton `pg.Pool` with connection lifecycle management, `withTransaction` helper, and `withStatementTimeout` executing `SET LOCAL statement_timeout`.
- **Acceptance Criteria:**
  - Integration test verifies transaction rollback on error and statement timeout enforcement.
- **Completion Details:**
  - Implemented `src/db.ts` with singleton `pg.Pool`, parameterized `query()`, `withTransaction()` with automatic commit/rollback, `withStatementTimeout()` scoped transactionally, and `closePool()`.
  - Configured `tests/setup.ts` and `vitest.config.ts` for clean environment variable initialization.
  - Authored integration tests in `tests/integration/db.test.ts` verifying queries, commit, rollback on error, and statement timeout cancellation.

### SPRINT-1.3: Reference Seed & Locality Verification (`db/seeds/localities.sql`, `docs/locality-check.md`)
- **Status:** `[x] DONE`
- **Scope:** Populate all 32 Chennai localities with OpenStreetMap centroids and aliases. Author script `scripts/seed-localities.ts` / `npm run seed:localities`. Document verification in `docs/locality-check.md`.
- **Acceptance Criteria:**
  - All 32 localities seeded. Point coordinates fall within `12.75 <= lat <= 13.30` and `79.95 <= lng <= 80.40`.
- **Completion Details:**
  - Authored `db/seeds/localities.sql` containing all 32 Chennai localities with verified aliases and PostGIS Point geography centroids.
  - Implemented `scripts/seed-localities.ts` with validation that all 32 records exist and fall within Chennai service area.
  - Documented spot-checks in `docs/locality-check.md`.

### SPRINT-1.4: Pure Domain Module: Text Sanitization (`src/domain/text.ts`)
- **Status:** `[x] DONE`
- **Scope:** Implement `cleanInputText` and `normalizeSearchQuery` (stripping control chars, collapsing spaces, removing `/\bnear\s+me\b/i`).
- **Acceptance Criteria:**
  - Unit tests verify control char removal, length truncation, and regex query normalization.
- **Completion Details:**
  - Implemented `cleanInputText` and `normalizeSearchQuery` in `src/domain/text.ts` with zero external dependencies.
  - Authored unit test suite in `tests/unit/domain/text.test.ts` covering ASCII control chars, newlines, multiple space collapse, length truncation, and "near me" phrase stripping.

### SPRINT-1.5: Pure Domain Module: Locality Resolution (`src/domain/localities.ts`)
- **Status:** `[x] DONE`
- **Scope:** Implement locality resolution: alphanumeric normalization, exact match, alias lookup, 3-gram similarity scoring with `>= 0.6` threshold and `>= 0.1` separation, suggestion of 3 closest on failure.
- **Acceptance Criteria:**
  - Unit tests covering `"T. Nagar"`, `"t nagar"`, `"OMR"`, typos, ambiguous inputs, and unknown localities.
- **Completion Details:**
  - Implemented `src/domain/localities.ts` with immutable static Chennai 32 localities dataset, alphanumeric normalization, exact matching on names and aliases, and pg_trgm-identical 3-gram similarity ranking.
  - Implemented `>= 0.6` threshold and `>= 0.1` separation rule with 3 closest suggestions fallback.
  - Unit tests in `tests/unit/domain/localities.test.ts` pass with 100% coverage.

### SPRINT-1.6: Pure Domain Module: Hours & `open_now` Engine (`src/domain/hours.ts`)
- **Status:** `[x] DONE`
- **Scope:** Implement `Asia/Kolkata` datetime evaluation, split shift intervals, overnight intervals (`close_time < open_time`), 24h intervals (`00:00` to `23:59`), calendar closures cancelling overnight intervals, overlap validation.
- **Acceptance Criteria:**
  - Comprehensive unit tests: standard daytime, overnight across midnight, split shifts, closure cancellation of overnight tails, unknown hours returning `null`, weekday wrap (Sunday->Monday).
- **Completion Details:**
  - Implemented `src/domain/hours.ts` with `evaluateOpenNow`, `formatTodayHours`, `formatWeeklyHours`, and `validateIntervals`.
  - Modeled `Asia/Kolkata` evaluation with zero external dependencies, handling standard daytime, split shifts, overnight intervals, 24-hour schedules, and full overnight closure cancellation per rule 7.3.3.
  - Authored 16 unit tests in `tests/unit/domain/hours.test.ts` covering all edge cases.

### SPRINT-1.7: Pure Domain Module: Pricing Display (`src/domain/pricing.ts`)
- **Status:** `[x] DONE`
- **Scope:** Implement `formatPriceDisplay` with Indian digit grouping (`₹1,00,000`), price range computation over matching items.
- **Acceptance Criteria:**
  - Unit tests verifying `fixed`, `starting_from`, `range`, `on_request`, and price ceiling comparisons.
- **Completion Details:**
  - Implemented `src/domain/pricing.ts` with `formatPriceDisplay`, `formatInrAmount` (en-IN grouping), `computePriceRange`, and `satisfiesPriceCeiling` (excluding `on_request`).
  - Authored unit tests in `tests/unit/domain/pricing.test.ts` with 100% test coverage.

### SPRINT-1.8: Pure Domain Module: Action Links & WhatsApp Templates (`src/domain/action-links.ts`)
- **Status:** `[x] DONE`
- **Scope:** Generate sanitized enquiry URLs and message templates for `whatsapp`, `external_url`, and `phone_only` across `repair_service`, `salon_wellness`, and `food_beverage`.
- **Acceptance Criteria:**
  - Unit tests verifying URI encoding, note sanitization, and fallback phone/URL links.
- **Completion Details:**
  - Implemented `src/domain/action-links.ts` with `generateActionLink()`, sanitizing preferred_time and customer_note, and constructing WhatsApp, external URL, and tel: links.
  - Implemented templates across repair_service, salon_wellness, and food_beverage with exact disclaimer.
  - Authored unit test suite in `tests/unit/domain/action-links.test.ts` passing all 7 test cases.

### SPRINT-1.9: Benchmark Dataset Seed (`db/seeds/sample.sql`)
- **Status:** `[x] DONE`
- **Scope:** Author SQL seed for 36 contrastive shops across 4 localities (Anna Nagar, Adyar, Velachery, T. Nagar) with ~400 catalog items, contrastive distractors, overnight hours, closures, and 1 adversarial injection shop.
- **Acceptance Criteria:**
  - `npm run seed:sample` populates benchmark data with `is_sample_data = true`.
- **Completion Details:**
  - Implemented `scripts/seed-sample.ts` and generated `db/seeds/sample.sql` with 36 synthetic contrastive shops (12 repair, 12 salon, 12 food) across Anna Nagar, Adyar, Velachery, and T. Nagar.
  - Included 3 shops with unknown hours, 2 shops with overnight intervals, 2 shops with scheduled closures, 2 shops with `on_request` pricing, and 1 shop with adversarial prompt injection in item description.
  - Successfully seeded live PostGIS database and verified data integrity.

---

## Sprint 2: Authentication, Security & Admin Portal (M2)

### SPRINT-2.1: Password Management & CSPRNG Temp Passwords (`src/auth/passwords.ts`)
- **Status:** `[x] DONE`
- **Scope:** Argon2id hashing & verification, dummy hash timing equalization, 12-char CSPRNG temporary password generator.
- **Acceptance Criteria:**
  - Unit tests verifying hash verification and CSPRNG character set distribution.
- **Completion Details:**
  - Implemented `src/auth/passwords.ts` with Argon2id password hashing and verification.
  - Implemented timing-equalization `verifyDummyPassword` against unknown user probes.
  - Implemented CSPRNG 12-character temporary password generator using the 58 unambiguous character alphabet.
  - Implemented password complexity validator enforcing 8–128 chars, letters, digits, and no match with username/old password.
  - Authored 11 unit tests in `tests/unit/auth/passwords.test.ts` passing 100%.

### SPRINT-2.2: Session Management & Rate Limiting (`src/auth/sessions.ts`, `src/rate-limit.ts`)
- **Status:** `[x] DONE`
- **Scope:** Secure cookies (`sf_session`), SHA-256 token hashing, 7-day expiration, sliding window in-memory rate limiter (60 req/min/IP).
- **Acceptance Criteria:**
  - Integration tests for session creation, validation, expiration, and rate-limit tripping.
- **Completion Details:**
  - Implemented in-memory sliding window rate limiter in `src/rate-limit.ts` (60 req/min/IP default, configurable limits, auto-cleanup of stale windows).
  - Implemented session manager in `src/auth/sessions.ts` with 32-byte CSPRNG hex tokens, SHA-256 token hashing for DB persistence, 7-day expiration, `createSession`, `validateSession`, `deleteSession`, and `deleteAllUserSessions`.
  - Authored 4 unit tests in `tests/unit/rate-limit.test.ts` and 4 integration tests in `tests/integration/sessions.test.ts` passing 100%.

### SPRINT-2.3: Lockout Guard & Login Flow (`src/auth/lockout.ts`, `src/app/login/page.tsx`)
- **Status:** `[x] DONE`
- **Scope:** 5-failure / 15-minute sliding window lockout on `login_attempts`. Unified `/login` route handler and page with constant-time response.
- **Acceptance Criteria:**
  - Integration tests verifying lockout triggers at 5 failures and unblocks after 15 minutes.
- **Completion Details:**
  - Implemented `src/auth/lockout.ts` with `isLockedOut` (5-failure / 15-minute sliding window), `recordLoginAttempt`, and `authenticateUser` adhering to constant-time timing probe equalization, inactive account message delay until after password verification, and session token generation.
  - Implemented Next.js Server Action `src/app/login/actions.ts` setting `sf_session` cookie (`HttpOnly`, `SameSite=Lax`, `Secure` in prod) and role-based redirects (`/admin` and `/owner`).
  - Implemented accessible, responsive `/login` UI with WCAG AA contrast error alerts in `src/app/login/LoginForm.tsx` and `src/app/login/page.tsx`.
  - Authored 8 integration tests in `tests/integration/auth-lockout.test.ts` passing 100%.

### SPRINT-2.4: Admin CLI Scripts (`scripts/create-admin.ts`, `scripts/reset-admin-password.ts`)
- **Status:** `[x] DONE`
- **Scope:** CLI scripts to securely create admin accounts and reset passwords with hidden prompts.
- **Acceptance Criteria:**
  - Scripts execute cleanly from CLI creating valid admin user in database.
- **Completion Details:**
  - Implemented `src/auth/admin-ops.ts` with `createAdminUser` and `resetAdminPassword` enforcing username regex `^[a-z0-9_]{3,30}$`, display name length guards, password complexity validation, and session invalidation on password reset.
  - Implemented `scripts/prompt-password.ts` with hidden terminal input (TTY raw mode without stdout echo, graceful fallback for non-TTY).
  - Implemented executable scripts `scripts/create-admin.ts` and `scripts/reset-admin-password.ts` supporting `--username`, `--display-name`, and `--password` flags or interactive masked prompts.
  - Authored 6 integration tests in `tests/integration/admin-cli.test.ts` passing 100%. Verified CLI execution end-to-end.

### SPRINT-2.5: Admin Portal Layout, Guards & Owner Management (`src/app/admin/owners/*`)
- **Status:** `[x] DONE`
- **Scope:** `requireAdmin` guard, CSRF Origin check, Owners list, New Owner creation with one-time temporary password display, reset password, disable/enable owner.
- **Acceptance Criteria:**
  - A1, A2, A6, A7 flow tests passing. Audit logs recorded for every mutation.
- **Completion Details:**
  - Implemented `src/audit.ts` structured audit logging with strict redaction of passwords, hashes, and session tokens.
  - Implemented `src/auth/owner-ops.ts` (`createOwnerAccount`, `resetOwnerPassword`, `disableOwnerAccount`, `enableOwnerAccount`, `listOwnersWithShops`) enforcing 12-char CSPRNG unambiguous passwords, session invalidation on disable/reset, and shop locking.
  - Implemented `src/auth/guards.ts` with `requireAdmin`, `requireOwner`, and `verifyCsrfOrigin` against `APP_BASE_URL`.
  - Implemented Next.js Admin Layout (`src/app/admin/layout.tsx`), root redirect (`src/app/admin/page.tsx`), owners table (`src/app/admin/owners/page.tsx`, `src/app/admin/owners/OwnersTable.tsx`), and new owner form (`src/app/admin/owners/new/page.tsx`, `src/app/admin/owners/new/NewOwnerForm.tsx`) with server actions in `src/app/admin/owners/actions.ts`.
  - Authored 5 integration tests in `tests/integration/admin-owners.test.ts` and 3 unit tests in `tests/unit/auth/guards.test.ts` passing 100%.

### SPRINT-2.6: Admin Portal Shop Management (`src/app/admin/shops/*`)
- **Status:** `[x] DONE`
- **Scope:** Admin shop creation, editing, Make Live (with >= 1 available item check), Pause (`admin_locked = true`), Delete with double confirmation slug typing.
- **Acceptance Criteria:**
  - A3, A4, A5 flow tests passing.
- **Completion Details:**
  - Implemented `src/admin/shop-ops.ts` (`createAdminShop`, `updateAdminShop`, `makeShopLive`, `pauseShop`, `deleteShop`, `listAdminShops`, `getAdminShopById`) enforcing Chennai bounding box constraints, action mode invariants, draft initial status, and audit logging on mutations.
  - Implemented `makeShopLive` invariant requiring at least 1 available catalog item (rejecting with exact PRD message `"Add at least one available menu item first"`).
  - Implemented `pauseShop` setting status to `paused` and `admin_locked = TRUE`.
  - Implemented `deleteShop` requiring exact slug match confirmation before executing transactional cascade deletion.
  - Implemented Next.js Admin Shops UI: list table (`src/app/admin/shops/page.tsx`, `ShopsTable.tsx`), creation form with locality coordinates auto-population (`src/app/admin/shops/new/page.tsx`, `NewShopForm.tsx`), and edit/manage interface (`src/app/admin/shops/[id]/page.tsx`, `EditShopForm.tsx`).
  - Authored 5 integration tests in `tests/integration/admin-shops.test.ts` passing 100%.

### SPRINT-2.7: Admin Telemetry & Audit Log Viewers (`src/app/admin/logs/page.tsx`, `src/app/admin/audit/page.tsx`)
- **Status:** `[x] DONE`
- **Scope:** Filterable search logs viewer with p50/p95 latency summary strip and CSV export. Filterable audit log viewer with JSON diff formatting.
- **Acceptance Criteria:**
  - A8, A9 acceptance tests passing.
- **Completion Details:**
  - Implemented `src/admin/telemetry-ops.ts` with `getSearchLogs` (aggregating query count, rerank rate %, fallback rate %, and PostgreSQL `percentile_cont` p50/p95 latency for `find_shops`), `exportSearchLogsCsv` (RFC-compliant CSV serializer with header columns), and `getAuditLogs` with actor/entity filters and state diff parsing.
  - Implemented Next.js CSV export route handler `src/app/api/admin/logs/export/route.ts` with admin session verification and `Content-Disposition: attachment`.
  - Implemented telemetry logs page `src/app/admin/logs/page.tsx` with top summary statistics strip, channel/tool/fallback filters, CSV export trigger, and responsive table.
  - Implemented audit logs page `src/app/admin/audit/page.tsx` with actor/entity filters and side-by-side JSON before/after state diff cards.
  - Authored 4 integration tests in `tests/integration/admin-logs.test.ts` passing 100%. Milestone M2 exit gate achieved.

---

## Sprint 3: Owner Portal (M3)

### SPRINT-3.1: Forced First-Login Password Change Gate (`src/app/owner/change-password/page.tsx`)
- **Status:** `[x] DONE`
- **Scope:** Redirect gate when `must_change_password = true`, password validation (8–128 chars, 1 letter, 1 digit, no username/old password match), session revocation.
- **Acceptance Criteria:**
-   - O1 acceptance tests passing.
- **Completion Details:**
  - Implemented `src/owner/account-ops.ts` with `forceChangeOwnerPassword` enforcing complexity rules, distinct new password, clearing `must_change_password = FALSE`, revoking all other active sessions for the user (`deleteAllUserSessions(user.id, currentSessionToken)`), and recording an audit trail.
  - Implemented Next.js Owner layout (`src/app/owner/layout.tsx`) with strict authentication guards redirecting owners with `must_change_password = true` exclusively to `/owner/change-password`.
  - Implemented accessible `/owner/change-password` page and form (`src/app/owner/change-password/page.tsx`, `ChangePasswordForm.tsx`, `actions.ts`).
  - Authored 4 integration tests in `tests/integration/owner-auth.test.ts` passing 100%.

### SPRINT-3.2: Owner Dashboard & IDOR-Guarded Shop Details (`src/app/owner/page.tsx`, `src/app/owner/shop/page.tsx`)
- **Status:** `[ ] TODO`
- **Scope:** Owner dashboard with status badges and hours alert. Shop details editing strictly resolved via `owner_id = session.user.id`. Read-only restricted fields.
- **Acceptance Criteria:**
  - O3, O4 tests passing; cross-tenant IDOR attack returns 404.

### SPRINT-3.3: Owner Menu & Catalog Management (`src/app/owner/menu/page.tsx`)
- **Status:** `[ ] TODO`
- **Scope:** Catalog CRUD with grouping, sort order, available toggle, 100-item limit enforcement, and D13 live-shop invariant enforcement.
- **Acceptance Criteria:**
  - O5 tests passing; deleting or toggling last available item on live shop rejected.

### SPRINT-3.4: Owner Weekly Hours & Closures Management (`src/app/owner/hours/page.tsx`)
- **Status:** `[ ] TODO`
- **Scope:** Weekly schedule editor with non-overlapping interval validation, overnight rule instructions, one-off closure manager. Transition `hours_status` to `set`.
- **Acceptance Criteria:**
  - O6 tests passing.

### SPRINT-3.5: Owner Pause, Resume & Self-Service Account (`src/app/owner/account/page.tsx`)
- **Status:** `[ ] TODO`
- **Scope:** Owner pause/resume (blocked when `admin_locked = true`), self-service password change.
- **Acceptance Criteria:**
  - O7, O8 tests passing.

---

## Sprint 4: Search Engine Stage 1 & MCP Server (M4)

### SPRINT-4.1: Stage 1 Candidate Pool SQL Query (`src/search/stage1.ts`)
- **Status:** `[ ] TODO`
- **Scope:** Implement SQL Query 1 enforcing H1 (live/sample), H2 (category), H3 (PostGIS ST_DWithin), H4 (item count >= 1), H5 (price ceiling on query-matching items), trigram text ranking, statement timeout 250ms.
- **Acceptance Criteria:**
  - Integration tests for each filter H1–H5 in isolation and combined.

### SPRINT-4.2: H6 Open-Now Node Filter & Item Fetch SQL Query (`src/search/stage1.ts`)
- **Status:** `[ ] TODO`
- **Scope:** Node.js IST `open_now` filtering over candidate pool, slicing to top 10 candidates. SQL Query 2 fetching top 5 items and `menu_updated_at`.
- **Acceptance Criteria:**
  - Integration tests confirming open/closed filtering and accurate top 5 items ranking.

### SPRINT-4.3: Relaxation Hints Generator (`src/search/stage1.ts`)
- **Status:** `[ ] TODO`
- **Scope:** Fast count-pass relaxing radius (to 25km), max price, open now, or category when results are 0 and location is present.
- **Acceptance Criteria:**
  - Integration tests verifying correct relaxation suggestions.

### SPRINT-4.4: Search Orchestrator & Telemetry (`src/search/search-shops.ts`)
- **Status:** `[ ] TODO`
- **Scope:** Pre-flight validation (near me check, coordinates bounding box, locality resolution), search budget tracking (700ms), telemetry writer to `search_logs`.
- **Acceptance Criteria:**
  - MCP and web queries logged to `search_logs` with stage timings.

### SPRINT-4.5: Stateless MCP Server Setup & `POST /mcp` (`src/mcp/server.ts`, `src/app/mcp/route.ts`)
- **Status:** `[ ] TODO`
- **Scope:** MCP SDK v1.x `StreamableHTTPServerTransport` stateless route handler (`sessionIdGenerator: undefined`, fresh server per request). Reject GET/DELETE with 405. Sliding window rate limit check.
- **Acceptance Criteria:**
  - Protocol conformance tests: stateless lifecycle, HTTP 405 on GET, rate limiting.

### SPRINT-4.6: MCP Tools Implementation (`src/mcp/tools/*`)
- **Status:** `[ ] TODO`
- **Scope:** Implement 5 tools: `find_shops`, `get_shop_info`, `get_catalog` (cursor-paginated), `search_catalog`, `get_action_link`. All declare `readOnlyHint: true`.
- **Acceptance Criteria:**
  - Integration tests for all 5 tools covering success, schema errors, and error codes (`invalid_input`, `location_required`, `locality_not_found`, `outside_service_area`, `shop_not_found`, `item_not_found`).

---

## Sprint 5: Stage 2 Reranker & Offline Evaluation Framework (M5)

### SPRINT-5.1: Jev Decisions API Client (`src/search/rerank/jev-client.ts`)
- **Status:** `[ ] TODO`
- **Scope:** Shared `AbortController`, strict budget timeout calculation (`min(450ms, remaining - 30)`), probability distribution validation (`sum = 1.0 +- 0.01`).
- **Acceptance Criteria:**
  - Mocked network tests verifying timeout abort, error handling, and distribution validation.

### SPRINT-5.2: Shop Reranker Orchestrator & Fail-Open Fallback (`src/search/rerank/shop-reranker.ts`)
- **Status:** `[ ] TODO`
- **Scope:** Parallel candidate dispatch, prompt truncation guards, expected score calculation $E[\text{score}]$, tie-breaking with baseline rank, all-or-nothing fallback on any single failure.
- **Acceptance Criteria:**
  - Unit tests verifying fallback reasons (`budget`, `timeout`, `http_error`, `invalid_schema`, `not_applicable`, `disabled`).

### SPRINT-5.3: Evaluation Harness & Metrics (`eval/metrics.ts`, `eval/run-benchmark.ts`)
- **Status:** `[ ] TODO`
- **Scope:** Implement `NDCG@5`, `MRR@5`, `Recall@10`, seeded Mulberry32 10k bootstrap CI, Cohen's kappa. Create offline cache-backed evaluation runner.
- **Acceptance Criteria:**
  - Unit tests on toy rankings with hand-computed values.

### SPRINT-5.4: Benchmark Queries & Hand Labels (`eval/benchmark_queries.json`, `eval/labels.json`)
- **Status:** `[ ] TODO`
- **Scope:** Author 40 queries across 4 categories (30 dev, 10 held-out) and complete 0–3 relevance ground-truth labels for candidate pairs.
- **Acceptance Criteria:**
  - `npm run eval` executes against cached evaluation set and outputs `eval/results/latest-report.md`.

### SPRINT-5.5: Adversarial Prompt Injection Test (`eval/run-benchmark.ts:injection`)
- **Status:** `[ ] TODO`
- **Scope:** Verify shop with adversarial injection prompt in item description scores $E[\text{score}] < 1.5$ on unrelated query and does not displace legitimate exact matches.
- **Acceptance Criteria:**
  - `npm run eval:injection` passes.

---

## Sprint 6: Public Web UI, Deployment & E2E Testing (M6)

### SPRINT-6.1: Public Web Search Page (`src/app/page.tsx`, `src/app/api/search/route.ts`)
- **Status:** `[ ] TODO`
- **Scope:** Search UI (W1, W4) with query input, locality dropdown, category filter, max price, open now checkbox, result cards with price ranges, relaxation hints display, mobile responsive design.
- **Acceptance Criteria:**
  - Accessible inputs, keyboard navigation, empty state hints.

### SPRINT-6.2: Public Shop Detail Page (`src/app/shop/[slug]/page.tsx`)
- **Status:** `[ ] TODO`
- **Scope:** Shop details (W2, W3), weekly hours schedule, upcoming closures, full menu grouped by category, action link Contact button with disclaimer.
- **Acceptance Criteria:**
  - Renders live shops; returns 404 for draft/paused/sample shops.

### SPRINT-6.3: Health Check & Maintenance Scripts (`src/app/api/health/route.ts`, `scripts/purge-logs.ts`)
- **Status:** `[ ] TODO`
- **Scope:** `GET /api/health` checking database connectivity. `scripts/purge-logs.ts` deleting `search_logs` older than `LOG_RETENTION_DAYS`.
- **Acceptance Criteria:**
  - Health check returns 200 on DB up, 503 on DB down. Purge script deletes stale rows.

### SPRINT-6.4: Docker Compose & Production Containerization (`Dockerfile`, `docker-compose.yml`)
- **Status:** `[ ] TODO`
- **Scope:** Multi-stage production `Dockerfile`, `docker-compose.yml` linking app and `postgis/postgis:15-3.4` with persistent volume and healthchecks.
- **Acceptance Criteria:**
  - `docker compose up` starts healthy database and application containers.

### SPRINT-6.5: Playwright Full Lifecycle E2E Test (`tests/e2e/lifecycle.spec.ts`)
- **Status:** `[ ] TODO`
- **Scope:** Automated end-to-end user journey: Admin logs in -> creates owner -> creates shop -> owner logs in & changes password -> adds items and hours -> admin makes live -> customer searches on `/` -> views shop -> clicks Contact -> owner pauses shop -> shop disappears from search.
- **Acceptance Criteria:**
  - `npm run test:e2e` passes in CI headless mode.

---

## Sprint 7: Pilot Onboarding, Operations & Launch Gate (M7)

### SPRINT-7.1: Operations & Backup Runbook (`docs/operations.md`)
- **Status:** `[ ] TODO`
- **Scope:** Author crontab setup, nightly `pg_dump` backup, retention policy, and tested restore verification steps.
- **Acceptance Criteria:**
  - Backup and restore cycle verified against test database.

### SPRINT-7.2: Pilot Onboarding Verification Log (`docs/pilot-log.md`)
- **Status:** `[ ] TODO`
- **Scope:** Document 10+ real verified Chennai shops with owner consent, verified contact details, >= 6 available items, and set hours.
- **Acceptance Criteria:**
  - Pilot requirements (Section 16.3) satisfied.

### SPRINT-7.3: Comprehensive Documentation & Client Config (`README.md`)
- **Status:** `[ ] TODO`
- **Scope:** Complete `README.md` with problem statement, system architecture, Claude Desktop setup (`claude_desktop_config.json`), sample transcripts, evaluation results, and known limitations.
- **Acceptance Criteria:**
  - Clear, reproducible setup instructions from fresh clone.

### SPRINT-7.4: Launch Gate Verification
- **Status:** `[ ] TODO`
- **Scope:** Execute full verification triumvirate:
  - `npm ci && npm run migrate && npm test && npm run typecheck && npm run lint`
  - `npm run test:e2e`
  - `npm run eval`
- **Acceptance Criteria:**
  - All items in PRD Section 21.1 Launch Checklist confirmed green.
