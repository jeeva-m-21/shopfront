# Shopfront — System Architecture (`architecture.md`)

**Version:** 2.0 (Locked to PRD v2.0)  
**Target Environment:** Single-node Docker Compose (Long-running Node.js LTS + PostgreSQL 15+)  
**Geography / Locale:** Chennai, Tamil Nadu, India (`Asia/Kolkata`, `INR` / `en-IN`)  
**Core Architectural Mandates:** Zero-ORM overhead (`pg` raw SQL), deterministic constraint enforcement in PostgreSQL, fail-open Stage 2 reranking via Jev API, strict sub-800ms p95 search latency.

---

## 1. Complete Repository & Folder Structure

Every file in the repository has a single, deterministic responsibility. Business logic (`src/domain/`) is strictly isolated from I/O (`src/db.ts`, `src/search/rerank/jev-client.ts`) so unit tests run in milliseconds without network or database dependencies.

```text
shopfront/
├── .env.example                        # Template of all required/optional env vars
├── .gitignore                          # Excludes node_modules, .next, .env
├── docker-compose.yml                  # App + postgis/postgis:15-3.4 container definition
├── Dockerfile                          # Multi-stage Node.js LTS production build
├── next.config.mjs                     # Next.js App Router config + security headers
├── package.json                        # Exact pinned versions (no ^ or ~), lockfile committed
├── package-lock.json
├── playwright.config.ts                # E2E browser test configuration
├── tsconfig.json                       # TypeScript strict: true configuration
├── vitest.config.ts                    # Unit & integration test runner config
│
├── db/
│   ├── migrations/
│   │   └── 0001_initial_schema.sql     # Authoritative DDL contract (PostGIS, pg_trgm, pgcrypto)
│   └── seeds/
│       ├── localities.sql              # 32 static Chennai localities + aliases + center points
│       └── sample.sql                  # 36 synthetic contrastive shops (~400 catalog items)
│
├── docs/
│   ├── decisions.md                    # Architectural & PRD decision log (D1–D18)
│   ├── jev-api-notes.md                # Frozen Jev request schema & M0 latency spike p50/p95
│   ├── locality-check.md               # OpenStreetMap verification log for 32 Chennai centroids
│   ├── operations.md                   # Cron setup, pg_dump backup, and restore runbook
│   └── pilot-log.md                    # Onboarding verification log for >= 10 real Chennai shops
│
├── eval/
│   ├── benchmark_queries.json          # 40 queries (30 dev, 10 held_out across 4 categories)
│   ├── labels.json                     # Hand-labeled 0-3 relevance scores + 2nd-rater subset
│   ├── metrics.ts                      # NDCG@5, MRR@5, Recall@10, 10k seeded bootstrap CI, Kappa
│   ├── run-benchmark.ts                # CLI harness for offline cached, --live, and :injection runs
│   ├── cache/                          # Committed deterministic Jev response cache (SHA-256 keyed)
│   └── results/
│       └── latest-report.md            # Generated markdown evaluation report
│
├── scripts/
│   ├── migrate.ts                      # Sequential migration runner tracking schema_migrations
│   ├── create-admin.ts                 # CLI to create admin user with hidden password prompt
│   ├── reset-admin-password.ts         # CLI to reset admin password & clear sessions
│   └── purge-logs.ts                   # Cron target: deletes search_logs older than LOG_RETENTION_DAYS
│
├── src/
│   ├── config.ts                       # Startup Zod environment parser & constants
│   ├── db.ts                           # Singleton pg.Pool, transaction helper, statement_timeout wrapper
│   ├── logger.ts                       # Structured JSON stdout logger with secret redaction
│   ├── rate-limit.ts                   # In-memory per-IP sliding window rate limiter (60 req/min)
│   │
│   ├── domain/                         # Pure TypeScript modules (Zero DB/HTTP imports)
│   │   ├── action-links.ts             # WhatsApp/URL/tel builder, message templates, sanitization
│   │   ├── hours.ts                    # Asia/Kolkata open_now(), split shifts, overnight & closures
│   │   ├── localities.ts               # Normalization, exact/alias lookup, trigram similarity
│   │   ├── pricing.ts                  # INR Indian digit grouping (₹1,00,000) & price ceiling logic
│   │   └── text.ts                     # Control-char stripping, whitespace collapsing, length guards
│   │
│   ├── auth/                           # Authentication, Session Management & RBAC
│   │   ├── passwords.ts                # Argon2id hash/verify, dummy hash timing equalization, CSPRNG temp password
│   │   ├── sessions.ts                 # Cookie parser, SHA-256 token hashing, 7-day expiry enforcement
│   │   ├── lockout.ts                  # 5-attempt / 15-minute sliding window lockout on login_attempts
│   │   └── guards.ts                   # requireAdmin, requireOwner, and Origin header CSRF verification
│   │
│   ├── search/                         # Two-Stage Search Engine
│   │   ├── stage1.ts                   # Parameterized SQL Query 1 (H1-H5), App H6 filter, SQL Query 2 (items), relaxation_hints
│   │   ├── search-shops.ts             # Top-level searchShops(input, channel) orchestrator & telemetry writer
│   │   └── rerank/
│   │       ├── jev-client.ts           # Native fetch wrapper, shared AbortController, probability schema validator
│   │       └── shop-reranker.ts        # Parallel dispatch, E[score] computation, 4-decimal rounding, tie-breaking
│   │
│   ├── mcp/                            # Model Context Protocol Server (SDK v1.x)
│   │   ├── server.ts                   # Stateless factory creating McpServer + StreamableHTTPServerTransport per POST
│   │   └── tools/
│   │       ├── find-shops.ts           # Tool definition, Zod validation, "near me" check, calls searchShops()
│   │       ├── get-shop-info.ts        # Fetches live shop metadata, formatted hours, upcoming closures
│   │       ├── get-catalog.ts          # Cursor-paginated (25/page) available items grouped by group_name
│   │       ├── search-catalog.ts       # Trigram similarity item search within a single shop
│   │       └── get-action-link.ts      # Validates shop/item, generates enquiry URL & disclaimer
│   │
│   └── app/                            # Next.js App Router (Pages & Route Handlers)
│       ├── layout.tsx                  # Root HTML shell, accessible typography, mobile-first viewport
│       ├── page.tsx                    # Public Web Search (/) — W1, W4
│       ├── shop/
│       │   └── [slug]/
│       │       └── page.tsx            # Public Shop Detail (/shop/[slug]) — W2, W3
│       ├── login/
│       │   └── page.tsx                # Unified Admin & Owner Login (/login) — D18, A1, O1, O2, O9
│       ├── admin/                      # Admin Portal (/admin/*) — Protected by requireAdmin
│       │   ├── layout.tsx
│       │   ├── page.tsx                # Admin overview / Shops list (A4)
│       │   ├── owners/
│       │   │   ├── page.tsx            # List, disable/enable, reset password (A2, A6, A7)
│       │   │   └── new/page.tsx        # Create owner + one-time temp password display (A2)
│       │   ├── shops/
│       │   │   ├── new/page.tsx        # Create shop (A3)
│       │   │   └── [id]/page.tsx       # Edit shop, menu, hours, Make Live, Pause, Delete (A4, A5)
│       │   ├── logs/page.tsx           # Search telemetry viewer, p50/p95 summary strip, CSV export (A8)
│       │   └── audit/page.tsx          # Audit log viewer with JSON diff formatting (A9)
│       ├── owner/                      # Owner Portal (/owner/*) — Protected by requireOwner
│       │   ├── layout.tsx              # Enforces must_change_password redirect gate (O1)
│       │   ├── page.tsx                # Owner Dashboard, status badges, pause/resume toggle (O3, O7)
│       │   ├── change-password/page.tsx# Forced first-login password change form (O1)
│       │   ├── shop/page.tsx           # Edit allowed shop details (O4)
│       │   ├── menu/page.tsx           # Manage catalog items, enforce 100-item cap & D13 invariant (O5)
│       │   ├── hours/page.tsx          # Manage weekly intervals & one-off closures (O6)
│       │   └── account/page.tsx        # Self-service password change (O8)
│       ├── mcp/
│       │   └── route.ts                # POST /mcp handler (GET/DELETE return 405)
│       └── api/
│           ├── health/route.ts         # GET /api/health (SELECT 1 check)
│           └── search/route.ts         # Public web search endpoint (rate-limited, calls searchShops)
│
└── tests/
    ├── unit/                           # Pure domain, reranker math, and metrics tests
    ├── integration/                    # Real PostgreSQL tests (H1-H6, D13, Auth, IDOR, MCP contract, Reranker fallbacks)
    └── e2e/                            # Playwright full lifecycle test (Admin -> Owner -> Customer -> Pause)
```

---

## 2. System Topology & Tech Stack

### 2.1 Topology Diagram

```text
                       +-----------------------------------------+
                       |     Host TLS-Terminating Reverse Proxy  |
                       +--------------------+--------------------+
                                            | HTTPS
          +---------------------------------+---------------------------------+
          |                                 |                                 |
          v POST /mcp                       v GET /, /shop/[slug]             v /login, /admin/*, /owner/*
+-------------------+             +-------------------+             +-------------------+
|   MCP Handler     |             |  Public Web UI    |             |  Admin & Owner    |
| (Stateless SDK v1)|             |  & /api/search    |             |  Portals (POST)   |
+---------+---------+             +---------+---------+             +---------+---------+
          |                                 |                                 |
          | Rate Limit (60/min/IP)          | Rate Limit (60/min/IP)          | Session + Origin CSRF
          +----------------+----------------+                                 |
                           |                                                  |
                           v                                                  v
             +---------------------------+                      +---------------------------+
             |     searchShops()         |                      |   Portal Mutation Logic   |
             |  (Total Budget: 700ms)    |                      |  (Transactional + Audit)  |
             +------+-------------+------+                      +-------------+-------------+
                    |             |                                           |
   Stage 1 SQL      |             | Stage 2 Parallel HTTPS                    | Parameterized SQL
   (Timeout: 250ms) |             | (Timeout: min(450ms, rem))                | (FOR UPDATE locks)
                    v             v                                           v
         +-----------------+   +--------------------+              +--------------------+
         | PostgreSQL 15+  |   | Jev Decisions API  |              |  PostgreSQL 15+    |
         | PostGIS, pg_trgm|   | (Max 10 requests)  |              |  (Primary Tables)  |
         +-----------------+   +--------------------+              +--------------------+
```

### 2.2 Pinned Technology Stack (`5.2`, `D7`, `D16`)
* **Language:** TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`).
* **Runtime:** Node.js LTS (single long-running process inside Docker; no serverless functions).
* **Web Framework:** Next.js App Router (Server Components for initial renders, Route Handlers / Server Actions with strict `POST` + `Origin` validation for mutations).
* **Database:** PostgreSQL 15 (`postgis/postgis:15-3.4`) with `postgis`, `pg_trgm`, and `pgcrypto` extensions.
* **Database Driver:** `pg` (`node-postgres`). **No ORM (no Prisma/Drizzle/TypeORM)** to guarantee exact SQL execution plans, native PostGIS geography handling, and zero hydration overhead.
* **MCP SDK:** `@modelcontextprotocol/sdk` v1.x pinned to an exact version in `package.json` (`D7`). Uses `StreamableHTTPServerTransport` with `sessionIdGenerator: undefined` (stateless mode).
* **Validation:** `zod` (major version matching the pinned MCP SDK peer dependency).
* **Password Hashing:** `argon2` (`argon2id`).
* **Testing:** `vitest` (unit + integration against real Postgres) and `@playwright/test` (E2E).

---

## 3. Database Architecture & Complete SQL Schema

### 3.1 Migration Runner Tracking Table
`scripts/migrate.ts` creates and maintains a tracking table before applying `db/migrations/*.sql` in lexicographical order inside transactions:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.2 Authoritative Schema (`db/migrations/0001_initial_schema.sql`)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role     AS ENUM ('admin', 'owner');
CREATE TYPE shop_category AS ENUM ('repair_service', 'salon_wellness', 'food_beverage');
CREATE TYPE shop_status   AS ENUM ('draft', 'live', 'paused');
CREATE TYPE hours_status  AS ENUM ('unknown', 'set');
CREATE TYPE item_kind     AS ENUM ('product', 'service');
CREATE TYPE price_type    AS ENUM ('fixed', 'starting_from', 'range', 'on_request');
CREATE TYPE action_mode   AS ENUM ('whatsapp', 'external_url', 'phone_only');
CREATE TYPE diet_type     AS ENUM ('veg', 'non_veg', 'vegan', 'egg');

CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- 1. Localities (exactly 32 rows, seeded, read-only at runtime)
CREATE TABLE localities (
  id       SMALLSERIAL PRIMARY KEY,
  name     TEXT NOT NULL UNIQUE,
  aliases  TEXT[] NOT NULL DEFAULT '{}',
  center   GEOGRAPHY(Point, 4326) NOT NULL
);

-- 2. Users (admins and owners)
CREATE TABLE users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username             TEXT NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_]{3,30}$'),
  display_name         TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 80),
  role                 user_role NOT NULL,
  password_hash        TEXT NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at        TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. Sessions (token stored hashed as SHA-256 hex)
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions (user_id);

-- 4. Login attempts (for 5-failure / 15-min lockout)
CREATE TABLE login_attempts (
  id         BIGSERIAL PRIMARY KEY,
  username   TEXT NOT NULL,
  succeeded  BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_login_attempts_user_time ON login_attempts (username, created_at DESC);

-- 5. Shops (location is the single source of truth for coordinates - D4)
CREATE TABLE shops (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  slug                TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{3,60}$'),
  name                TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  category            shop_category NOT NULL,
  description         TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 500),
  address             TEXT NOT NULL CHECK (char_length(address) BETWEEN 5 AND 200),
  locality_id         SMALLINT NOT NULL REFERENCES localities(id),
  location            GEOGRAPHY(Point, 4326) NOT NULL,
  phone               TEXT NOT NULL CHECK (phone ~ '^\+91\d{10}$'),
  whatsapp            TEXT CHECK (whatsapp IS NULL OR whatsapp ~ '^\+91[6-9]\d{9}$'),
  booking_url         TEXT CHECK (booking_url IS NULL OR booking_url ~ '^https://\S+$'),
  website_url         TEXT CHECK (website_url IS NULL OR website_url ~ '^https://\S+$'),
  action_mode         action_mode NOT NULL,
  action_instructions TEXT CHECK (action_instructions IS NULL OR char_length(action_instructions) <= 200),
  is_sample_data      BOOLEAN NOT NULL,
  data_source_note    TEXT,
  status              shop_status NOT NULL DEFAULT 'draft',
  admin_locked        BOOLEAN NOT NULL DEFAULT FALSE,
  hours_status        hours_status NOT NULL DEFAULT 'unknown',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (action_mode <> 'whatsapp'     OR whatsapp    IS NOT NULL),
  CHECK (action_mode <> 'external_url' OR booking_url IS NOT NULL),
  CHECK (NOT is_sample_data OR data_source_note IS NOT NULL)
);
CREATE TRIGGER trg_shops_updated BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_shops_location_gist ON shops USING GIST (location) WHERE status = 'live';
CREATE INDEX idx_shops_category      ON shops (category)            WHERE status = 'live';
CREATE INDEX idx_shops_search_trgm   ON shops USING GIN ((name || ' ' || description) gin_trgm_ops);

-- 6. Weekly hours (weekday: 0 = Monday ... 6 = Sunday)
CREATE TABLE shop_hours (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id    UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  weekday    SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  open_time  TIME NOT NULL,
  close_time TIME NOT NULL,
  CHECK (open_time <> close_time)
);
CREATE INDEX idx_shop_hours_shop_day ON shop_hours (shop_id, weekday);

-- 7. One-off closures (whole calendar day in Asia/Kolkata)
CREATE TABLE shop_closures (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id   UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  closed_on DATE NOT NULL,
  reason    TEXT CHECK (reason IS NULL OR char_length(reason) <= 100),
  UNIQUE (shop_id, closed_on)
);

-- 8. Catalog items (search_text maintained by trigger - D8)
CREATE TABLE catalog_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  group_name    TEXT NOT NULL CHECK (char_length(group_name) BETWEEN 2 AND 50),
  name          TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  description   TEXT CHECK (description IS NULL OR char_length(description) <= 300),
  kind          item_kind NOT NULL,
  price_type    price_type NOT NULL,
  price_inr     INTEGER CHECK (price_inr IS NULL OR price_inr BETWEEN 0 AND 1000000),
  price_max_inr INTEGER CHECK (price_max_inr IS NULL OR price_max_inr <= 1000000),
  duration_min  SMALLINT CHECK (duration_min IS NULL OR duration_min BETWEEN 5 AND 480),
  diet          diet_type,
  tags          TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(tags) <= 10),
  available     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  search_text   TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (price_type = 'on_request'
       AND price_inr IS NULL AND price_max_inr IS NULL)
    OR (price_type IN ('fixed', 'starting_from')
       AND price_inr IS NOT NULL AND price_max_inr IS NULL)
    OR (price_type = 'range'
       AND price_inr IS NOT NULL AND price_max_inr IS NOT NULL AND price_max_inr >= price_inr)
  ),
  CHECK (duration_min IS NULL OR kind = 'service')
);

CREATE FUNCTION catalog_items_before_write() RETURNS trigger AS $$
BEGIN
  NEW.search_text := lower(
    NEW.name || ' ' || COALESCE(NEW.description, '') || ' ' || array_to_string(NEW.tags, ' ')
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_catalog_items_write BEFORE INSERT OR UPDATE ON catalog_items
  FOR EACH ROW EXECUTE FUNCTION catalog_items_before_write();

CREATE INDEX idx_catalog_items_shop ON catalog_items (shop_id, available, price_inr);
CREATE INDEX idx_catalog_items_trgm ON catalog_items USING GIN (search_text gin_trgm_ops);
CREATE INDEX idx_catalog_items_fts  ON catalog_items USING GIN (to_tsvector('english', search_text));

-- 9. Audit log (every create/update/delete in portals)
CREATE TABLE audit_log (
  id             BIGSERIAL PRIMARY KEY,
  actor_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_username TEXT NOT NULL,
  action         TEXT NOT NULL,
  entity_type    TEXT NOT NULL,
  entity_id      TEXT NOT NULL,
  before_data    JSONB,
  after_data     JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_time ON audit_log (created_at DESC);

-- 10. Search and tool telemetry
CREATE TABLE search_logs (
  id               BIGSERIAL PRIMARY KEY,
  channel          TEXT NOT NULL CHECK (channel IN ('mcp', 'web')),
  tool             TEXT NOT NULL,
  query_text       TEXT,
  locality_id      SMALLINT,
  category         shop_category,
  shop_id          UUID,
  candidate_count  SMALLINT,
  result_count     SMALLINT,
  reranked         BOOLEAN NOT NULL DEFAULT FALSE,
  jev_model        TEXT,
  fallback_reason  TEXT,
  error_code       TEXT,
  stage1_ms        INTEGER,
  jev_ms           INTEGER,
  total_ms         INTEGER NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_search_logs_time ON search_logs (created_at DESC);
```

### 3.3 SQL Read/Write Patterns for Coordinates (`D4`)
* **Writing Coordinates:**
  ```sql
  ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography
  ```
* **Reading Coordinates:**
  ```sql
  ST_Y(s.location::geometry) AS lat,
  ST_X(s.location::geometry) AS lng
  ```

---

## 4. Core Domain Modules (`src/domain/`)

All five domain modules are pure functions with zero I/O dependencies.

### 4.1 `src/domain/text.ts` (`7.7`)
* **`cleanInputText(raw: string, maxLen: number): string`**
  * Strips ASCII control characters (`[\x00-\x1F\x7F]`), replaces newlines/tabs with spaces, collapses multiple spaces into a single space, trims leading/trailing whitespace, and validates length against `maxLen`.
* **`normalizeSearchQuery(raw?: string): string`** (`12.1`)
  * Lowercases, strips control characters, removes whole-word or phrase matches of `"near me"` (case-insensitive regex `/\bnear\s+me\b/gi`), collapses whitespace, and trims.

### 4.2 `src/domain/localities.ts` (`7.5`, `7.8`)
* At server startup, all 32 rows from `localities` are loaded once into an immutable in-memory array (or passed directly in unit tests).
* **Normalization:** `input.toLowerCase().replace(/[^a-z0-9]/g, '')` (so `"T. Nagar"`, `"t nagar"`, and `"T.Nagar"` all normalize to `"tnagar"`).
* **Resolution Algorithm:**
  1. Check exact match against normalized `name` and every normalized string in `aliases` across all 32 localities.
  2. If no exact match, compute 3-gram similarity (identical to PostgreSQL `pg_trgm` padding: two leading spaces, one trailing space) between the normalized input and every normalized name/alias.For each locality, take its maximum similarity across its name and aliases.
  3. Sort localities by score descending. If `best.score >= 0.6` and `(best.score - secondBest.score) >= 0.1`, return `best`.
  4. Otherwise, return `{ error: 'locality_not_found', suggestions: [top1.name, top2.name, top3.name] }`.

### 4.3 `src/domain/hours.ts` (`7.3`, `D5`)
* **Time Zone Extraction:** Uses `Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', ... })` to deterministically extract `(year, month, day, weekday, hour, minute, second)` in IST regardless of the host OS timezone.
* **Weekday Mapping:** Converts standard day of week so `0 = Monday ... 6 = Sunday`.
* **`evaluateOpenNow(hoursStatus, intervals, closures, now): boolean | null`**
  1. If `hoursStatus === 'unknown'`, return `null`.
  2. Compute `todayDateStr` (`YYYY-MM-DD`) and `yesterdayDateStr` (`YYYY-MM-DD`) in `Asia/Kolkata`.
  3. Build a `Set` of closed date strings from `closures`.
  4. Convert current IST time to minutes or seconds since `00:00:00` (`nowTime`).
  5. Check `todayWeekday` intervals (only if `!closedDates.has(todayDateStr)`):
     * Same-day interval (`close_time > open_time`): matches if `open_time <= nowTime < close_time`.
     * Overnight interval (`close_time < open_time`): matches if `nowTime >= open_time`.
  6. Check `yesterdayWeekday` intervals (only if `!closedDates.has(yesterdayDateStr)`):
     * Overnight interval (`close_time < open_time`): matches if `nowTime < close_time`.
     * *(Note: If yesterday was in `shop_closures`, the overnight tail after midnight today is completely cancelled per `7.3.3`.)*
  7. Return `true` if any active interval matches; otherwise `false`.
* **Overlap Validation (Portal Save):**
  * For a given weekday, sort intervals by `open_time ASC`. Verify no two intervals on the same weekday overlap (`prev.close_time > next.open_time`, accounting for overnight intervals extending to `24:00` on that start day). Reject `open_time === close_time`.

### 4.4 `src/domain/pricing.ts` (`7.4`, `D2`)
* Uses `new Intl.NumberFormat('en-IN')` to format integers with Indian digit grouping (`100000` -> `1,00,000`).
* **`formatPriceDisplay(priceType, priceInr, priceMaxInr): string`**
  * `fixed` -> `₹${fmt(priceInr)}`
  * `starting_from` -> `From ₹${fmt(priceInr)}`
  * `range` -> `₹${fmt(priceInr)} – ₹${fmt(priceMaxInr)}`
  * `on_request` -> `Price on request`
* **`computePriceRange(matchingItems): [number, number] | null`**
  * Over matching items where `price_type !== 'on_request'` and `price_inr !== null`:
    * `min = Math.min(...items.map(i => i.price_inr))`
    * `max = Math.max(...items.map(i => i.price_max_inr ?? i.price_inr))`
  * Returns `[min, max]`, or `null` if no numeric items exist.

### 4.5 `src/domain/action-links.ts` (`11.5`)
* Strips newlines and control characters from `preferred_time` (<= 80 chars) and `customer_note` (<= 160 chars).
* Builds `{item_summary}` as `"{item_name}" ({price_display})`.
* Selects template by `shop.category` and whether `item` is present:
  * No item: `Hi {shop_name}, I found you on Shopfront and would like to enquire about your services.`
  * `repair_service`: `Hi {shop_name}, I'm enquiring about {item_summary} for repair/estimate.`
  * `salon_wellness`: `Hi {shop_name}, I'd like to check appointment availability for {item_summary}.`
  * `food_beverage`: `Hi {shop_name}, I'd like to enquire about ordering {item_summary}.`
* Appends optional suffixes in exact order:
  * If `preferred_time`: ` Preferred time: ${preferred_time}.`
  * If `customer_note`: ` Note: ${customer_note}`
  * Always appends: ` (via Shopfront)`
* Generates URL:
  * `whatsapp`: `https://wa.me/${shop.whatsapp.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`
  * `external_url`: `shop.booking_url`
  * `phone_only`: `tel:${shop.phone}`
* Attaches static disclaimer: `"Opens direct enquiry with the business; not an automatic confirmed booking."`

---

## 5. Two-Stage Search Pipeline Architecture (`src/search/`)

Both `find_shops` (MCP) and `/api/search` (Web) call `searchShops(rawInput, channel)`.

### 5.1 Pre-Flight Validation Order (`11.2`, `D10`, `D11`)
1. Validate basic schema via Zod (`limit`, `radius_km`, `max_price_inr`, etc.).
2. If both `locality` and (`lat` or `lng`) are provided -> return error `invalid_input`.
3. If `lat` is provided without `lng` (or vice versa) -> return error `invalid_input`.
4. Check raw query for `/\bnear\s+me\b/i`. If present and neither `locality` nor `lat/lng` was provided -> return error `location_required` with the 32 locality names.
5. If `locality` provided -> resolve via `localities.ts`. On failure -> return `locality_not_found` with 3 closest suggestions.
6. If `lat/lng` provided -> check bounding box `12.75 <= lat <= 13.30` and `79.95 <= lng <= 80.40` (`7.6`). On failure -> return `outside_service_area`.
7. Normalize query string via `normalizeSearchQuery(rawInput.query)` -> `q`.

### 5.2 Stage 1 SQL Query 1: Candidate Pool Retrieval (`src/search/stage1.ts`)
Executed inside a database client with `SET LOCAL statement_timeout = 250` (`STAGE1_TIMEOUT_MS`).

```sql
WITH params AS (
  SELECT
    $1::text AS q,                                      -- empty string '' if no query
    $2::boolean AS show_sample,                         -- config.SHOW_SAMPLE_DATA
    $3::shop_category AS category,                      -- NULL or enum
    CASE WHEN $4::double precision IS NOT NULL AND $5::double precision IS NOT NULL
         THEN ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography
         ELSE NULL
    END AS anchor,                                      -- $4 = lng, $5 = lat
    $6::double precision AS radius_m,                   -- radius_km * 1000
    $7::integer AS max_price_inr,                       -- NULL or price ceiling
    $8::real AS match_threshold                         -- config.ITEM_MATCH_THRESHOLD (0.15)
),
eligible_shops AS (
  SELECT
    s.id,
    s.slug,
    s.name,
    s.description,
    s.category,
    s.is_sample_data,
    s.hours_status,
    s.action_mode,
    l.name AS locality_name,
    CASE WHEN p.anchor IS NOT NULL
         THEN ST_Distance(s.location, p.anchor) / 1000.0
         ELSE NULL
    END AS distance_km,
    CASE WHEN p.q <> ''
         THEN GREATEST(
                similarity(lower(s.name || ' ' || s.description), p.q),
                word_similarity(p.q, lower(s.name || ' ' || s.description))
              )
         ELSE 0.0
    END AS shop_sim
  FROM shops s
  JOIN localities l ON l.id = s.locality_id
  CROSS JOIN params p
  WHERE s.status = 'live'                                                       -- H1
    AND (s.is_sample_data = FALSE OR p.show_sample = TRUE)                      -- H1
    AND (p.category IS NULL OR s.category = p.category)                         -- H2
    AND (p.anchor IS NULL OR ST_DWithin(s.location, p.anchor, p.radius_m))      -- H3
),
item_metrics AS (
  SELECT
    es.id AS shop_id,
    COUNT(ci.id) AS avail_count,
    MAX(
      CASE WHEN p.q <> ''
           THEN GREATEST(similarity(ci.search_text, p.q), word_similarity(p.q, ci.search_text))
           ELSE 0.0
      END
    ) AS max_item_sim,
    BOOL_OR(
      CASE WHEN p.q <> ''
           THEN to_tsvector('english', ci.search_text) @@ plainto_tsquery('english', p.q)
           ELSE FALSE
      END
    ) AS has_fts_match,
    BOOL_OR(
      CASE
        WHEN p.max_price_inr IS NULL THEN TRUE
        WHEN ci.price_type = 'on_request' OR ci.price_inr IS NULL THEN FALSE
        WHEN p.q = '' THEN ci.price_inr <= p.max_price_inr
        ELSE (
          GREATEST(similarity(ci.search_text, p.q), word_similarity(p.q, ci.search_text)) >= p.match_threshold
          OR to_tsvector('english', ci.search_text) @@ plainto_tsquery('english', p.q)
        ) AND ci.price_inr <= p.max_price_inr
      END
    ) AS passes_price_filter
  FROM eligible_shops es
  JOIN catalog_items ci ON ci.shop_id = es.id AND ci.available = TRUE
  CROSS JOIN params p
  GROUP BY es.id
),
scored_shops AS (
  SELECT
    es.*,
    LEAST(
      1.0,
      GREATEST(es.shop_sim, im.max_item_sim) + (CASE WHEN im.has_fts_match THEN 0.2 ELSE 0.0 END)
    ) AS text_score,
    CASE WHEN es.distance_km IS NOT NULL
         THEN 1.0 / (1.0 + es.distance_km)
         ELSE 0.0
    END AS distance_score
  FROM eligible_shops es
  JOIN item_metrics im ON im.shop_id = es.id
  CROSS JOIN params p
  WHERE im.avail_count >= 1                                                     -- H4
    AND im.passes_price_filter = TRUE                                           -- H5
)
SELECT
  ss.id,
  ss.slug,
  ss.name,
  ss.description,
  ss.category,
  ss.is_sample_data,
  ss.hours_status,
  ss.action_mode,
  ss.locality_name,
  ss.distance_km,
  CASE
    WHEN p.q <> '' AND p.anchor IS NOT NULL THEN (0.7 * ss.text_score) + (0.3 * ss.distance_score)
    WHEN p.q <> '' AND p.anchor IS NULL     THEN ss.text_score
    WHEN p.q = ''  AND p.anchor IS NOT NULL THEN ss.distance_score
    ELSE 0.0
  END AS baseline_score,
  COALESCE(
    (SELECT json_agg(json_build_object('weekday', sh.weekday, 'open_time', sh.open_time::text, 'close_time', sh.close_time::text))
     FROM shop_hours sh WHERE sh.shop_id = ss.id),
    '[]'::json
  ) AS hours_json,
  COALESCE(
    (SELECT json_agg(json_build_object('closed_on', sc.closed_on::text, 'reason', sc.reason))
     FROM shop_closures sc WHERE sc.shop_id = ss.id AND sc.closed_on >= CURRENT_DATE - 1),
    '[]'::json
  ) AS closures_json
FROM scored_shops ss
CROSS JOIN params p
ORDER BY baseline_score DESC, ss.distance_km ASC NULLS LAST, ss.slug ASC
LIMIT $9; -- CANDIDATE_POOL_SIZE (200)
```

### 5.3 Stage 1 Step 2 & SQL Query 2: H6 Filter and Item Fetch
1. **H6 Evaluation in Node.js:**
   * Iterate over the `<= 200` rows returned by Query 1.
   * Compute `openNow = evaluateOpenNow(row.hours_status, row.hours_json, row.closures_json, now)`.
   * If `input.open_now === true` and `openNow !== true` (excludes both `false` and `null`), filter out the shop.
   * Slice the remaining array to `CANDIDATE_COUNT` (`10`). Assign `baseline_rank = index + 1`.
2. **SQL Query 2 (Top 5 Items & `menu_updated_at` for the 10 Candidates):**
   ```sql
   SELECT
     s_id AS shop_id,
     (SELECT MAX(updated_at) FROM catalog_items WHERE shop_id = s_id AND available = TRUE) AS menu_updated_at,
     COALESCE(
       json_agg(item_row ORDER BY item_row.item_sim DESC, item_row.sort_order ASC, item_row.name ASC)
       FILTER (WHERE item_row.id IS NOT NULL),
       '[]'::json
     ) AS top_items
   FROM unnest($1::uuid[]) AS s_id
   LEFT JOIN LATERAL (
     SELECT
       ci.id,
       ci.name,
       ci.description,
       ci.tags,
       ci.price_type,
       ci.price_inr,
       ci.price_max_inr,
       ci.duration_min,
       ci.sort_order,
       CASE WHEN $2::text <> ''
            THEN GREATEST(similarity(ci.search_text, $2), word_similarity($2, ci.search_text))
            ELSE 0.0
       END AS item_sim,
       CASE WHEN $2::text <> ''
            THEN (
              GREATEST(similarity(ci.search_text, $2), word_similarity($2, ci.search_text)) >= $3::real
              OR to_tsvector('english', ci.search_text) @@ plainto_tsquery('english', $2)
            )
            ELSE TRUE
       END AS is_matching
     FROM catalog_items ci
     WHERE ci.shop_id = s_id AND ci.available = TRUE
     ORDER BY
       CASE WHEN $2::text <> ''
            THEN GREATEST(similarity(ci.search_text, $2), word_similarity($2, ci.search_text))
            ELSE 0.0
       END DESC,
       ci.sort_order ASC,
       ci.name ASC
     LIMIT 5
   ) item_row ON TRUE
   GROUP BY s_id;
   ```

### 5.4 Relaxation Hints Calculation (`11.2`, `W4`)
Triggered **only** when `candidates.length === 0` and a location anchor (`locality` or `lat/lng`) is present.
* For each active constraint among:
  * `radius` (if `radius_km < 25` -> test with `radius_km = 25`)
  * `max_price` (if `max_price_inr` set -> test with `max_price_inr = NULL`)
  * `open_now` (if `open_now = true` -> test with `open_now = false`)
  * `category` (if `category` set -> test with `category = NULL`)
* Execute a fast lightweight count pass relaxing **only** that single constraint while keeping all other constraints active. Omit any hint where `would_return === 0`.

### 5.5 Stage 2: Jev Reranker (`src/search/rerank/`)
1. **Gate Conditions (`12.3`):**
   * If `q === ''` or `candidates.length < 2` -> skip (`reranked: false, fallback_reason: 'not_applicable'`).
   * If `!config.RERANK_ENABLED` or `!config.JEV_API_KEY` or `!config.JEV_MODEL` -> skip (`reranked: false, fallback_reason: 'disabled'`).
   * Compute `jevTimeoutMs = Math.min(config.JEV_TIMEOUT_MS, config.TOTAL_BUDGET_MS - elapsedMs - 30)`.
   * If `jevTimeoutMs < 150` -> skip (`reranked: false, fallback_reason: 'budget'`).
2. **Payload Construction & Prompt-Injection Truncation (`12.3`):**
   * For each candidate (`<= 10`), construct state:
     ```json
     {
       "customer_query": "<raw query truncated to 200 chars>",
       "shop": {
         "name": "<truncated to 80 chars>",
         "category": "repair_service",
         "description": "<truncated to 300 chars>",
         "items": [
           {
             "name": "<truncated to 80 chars>",
             "description": "<truncated to 160 chars or null>",
             "tags": ["<up to 5 tags, each <= 30 chars>"]
           }
         ]
       }
     }
     ```
   * Note: Prices, distances, and opening hours are **never** sent to Jev.
3. **Parallel Execution & All-or-Nothing Fallback (`D14`):**
   * Create a single `const controller = new AbortController()` with `setTimeout(() => controller.abort(), jevTimeoutMs)`.
   * Dispatch all `N` `fetch(config.JEV_API_BASE_URL, { signal: controller.signal, ... })` calls via `Promise.all`.
   * Validate each response:
     * HTTP status must be `2xx` (otherwise `fallback_reason = 'http_error'`).
     * Distribution must contain 4 numbers `P(0), P(1), P(2), P(3)` where each `P(i) >= 0` and `Math.abs((P0 + P1 + P2 + P3) - 1.0) <= 0.01` (otherwise `fallback_reason = 'invalid_schema'`).
   * Compute expected score:
     $$E[\text{score}] = 0 \cdot P(0) + 1 \cdot P(1) + 2 \cdot P(2) + 3 \cdot P(3)$$
   * Sort candidates by `Math.round(expectedScore * 10000) / 10000` DESC, tie-breaking by `baseline_rank` ASC.
   * For output serialization, format `relevance_score = Math.round(expectedScore * 100) / 100`.

---

## 6. MCP Server Architecture (`src/mcp/`)

### 6.1 Stateless HTTP Transport (`src/app/mcp/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createShopfrontMcpServer } from '@/mcp/server';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

export async function POST(req: NextRequest) {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Strictly stateless per PRD 5.2 & 11.1
  });
  const server = createShopfrontMcpServer(req);
  await server.connect(transport);
  // Delegate standard Request/Response handling to transport
  return transport.handleRequest(req);
}

export async function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } });
}

export async function DELETE() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } });
}
```

### 6.2 Tool Registration & Error Contract (`11.1` – `11.5`)
* All 5 tools (`find_shops`, `get_shop_info`, `get_catalog`, `search_catalog`, `get_action_link`) register with `{ annotations: { readOnlyHint: true } }`.
* **Rate Limiting:** Before executing any tool body, check `rateLimiter.check(clientIp)`. If exceeded, log `error_code = 'rate_limited'` to `search_logs` and return:
  ```json
  {
    "isError": true,
    "content": [{ "type": "text", "text": "{\"error\":{\"code\":\"rate_limited\",\"message\":\"Too many requests. Limit is 60 per minute.\"}}" }]
  }
  ```
* **Cursor Pagination (`get_catalog`):**
  * Cursor encodes `{ s: sort_order, n: name, id: uuid }` as URL-safe Base64 JSON.
  * SQL keyset predicate: `WHERE (sort_order, name, id) > ($cursor.s, $cursor.n, $cursor.id) ORDER BY sort_order ASC, name ASC, id ASC LIMIT 26`.
  * Fetching `26` rows determines whether `next_cursor` is non-null without running a second `COUNT(*)` query.

---

## 7. Authentication, Authorization & Security Architecture (`src/auth/`)

### 7.1 Password & Timing-Safe Login Flow (`13.1`, `A1`, `O2`)
1. Pre-compute a valid dummy `argon2id` hash at module initialization (`DUMMY_ARGON2_HASH`).
2. When `POST /login` receives `{ username, password }`:
   * Query `login_attempts`:
     ```sql
     SELECT COUNT(*) FROM login_attempts
     WHERE username = $1 AND succeeded = FALSE AND created_at > now() - INTERVAL '15 minutes';
     ```
   * If `count >= 5`, immediately return `"Too many attempts. Try again in 15 minutes."` (does not record a new attempt).
   * Query `users WHERE username = $1`.
   * If user does not exist: call `await argon2.verify(DUMMY_ARGON2_HASH, password)`, insert `login_attempts(username, FALSE)`, and return `"Invalid username or password"`.
   * If user exists: call `await argon2.verify(user.password_hash, password)`.
     * If `false`: insert `login_attempts(username, FALSE)` and return `"Invalid username or password"`.
     * If `true` and `!user.is_active`: return `"This account is inactive. Contact the admin."` (checked **only** after password verification so usernames cannot be probed).
     * If `true` and `user.is_active`: insert `login_attempts(username, TRUE)`, update `users.last_login_at = now()`, generate a 32-byte CSPRNG token (`crypto.randomBytes(32).toString('base64url')`), store `sha256(token)` in `sessions` with `expires_at = now() + INTERVAL '7 days'`, set cookie `sf_session`, and redirect to `/admin` or `/owner`.

### 7.2 Authorization Guards & IDOR Prevention (`13.2`, `9`)
* **`requireAdmin()`:** Validates session cookie; verifies `user.role === 'admin'` and `user.is_active === true`. Redirects to `/login` on page load or returns `403` on POST routes.
* **`requireOwner()`:** Validates session cookie; verifies `user.role === 'owner'` and `user.is_active === true`. If `user.must_change_password === true` and current route is not `/owner/change-password`, redirects to `/owner/change-password`.
* **Zero-Trust Shop Resolution (IDOR Prevention):**
  * Owner routes (`/owner/shop`, `/owner/menu`, `/owner/hours`) **never** read `shop_id` from form fields or query parameters.
  * Every owner query resolves the target shop via:
    ```sql
    SELECT * FROM shops WHERE owner_id = $1; -- $1 = session.user.id
    ```
  * When editing or deleting a specific catalog item (`item_id`) or closure (`closure_id`), the `UPDATE`/`DELETE` statement joins or filters by `shop_id = (SELECT id FROM shops WHERE owner_id = $1)`. If `rowCount === 0`, the handler returns HTTP `404`.

### 7.3 Transactional Invariants & Audit Logging (`6`, `7.1`, `D13`)
Every mutating action in `/admin` and `/owner` executes inside a `withTransaction(async (client) => { ... })` wrapper that:
1. Locks the target row (`SELECT ... FROM shops WHERE id = $1 FOR UPDATE`) to serialize concurrent modifications.
2. Captures `before_data` (excluding `password_hash`).
3. Enforces application invariants:
   * **Make Live (`A5.1`) / Resume (`O7.2`):** Verifies `SELECT COUNT(*) FROM catalog_items WHERE shop_id = $1 AND available = TRUE` is `>= 1`. Otherwise rejects with `"Add at least one available menu item first"`.
   * **Item Toggle Off / Delete (`O5.7`, `D13`):** If `shop.status === 'live'` and the mutation would leave `0` available items, rolls back and rejects with `"A live shop needs at least one available item. Pause your listing first."`.
   * **Item Create (`O5.6`):** If `SELECT COUNT(*) FROM catalog_items WHERE shop_id = $1` is `>= 100`, rolls back and rejects with `"Menu limit reached (100 items)"`.
4. Executes the mutation and captures `after_data`.
5. Inserts a row into `audit_log (actor_id, actor_username, action, entity_type, entity_id, before_data, after_data)`.

### 7.4 HTTP Security Headers & CSRF (`13.3`)
Configured globally in `next.config.mjs` and verified in mutation route guards:
* `Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`
* `X-Content-Type-Options: nosniff`
* `Referrer-Policy: same-origin`
* `X-Frame-Options: DENY`
* `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (when `NODE_ENV=production`)
* **Origin Check:** Every `POST` handler outside `/mcp` validates `new URL(req.headers.get('origin')).origin === new URL(config.APP_BASE_URL).origin`. Missing or mismatched `Origin` returns `HTTP 403 Forbidden`.

---

## 8. Offline Evaluation Framework Architecture (`eval/`)

### 8.1Deterministic Cache Keying (`17.5`)
To ensure `npm run eval` runs with zero network calls and 100% repeatability:
* Each candidate Jev call computes:
  ```typescript
  const cacheKey = crypto
    .createHash('sha256')
    .update(JSON.stringify({ model: config.JEV_MODEL, state, question }))
    .digest('hex');
  ```
* Cached responses live in `eval/cache/${cacheKey}.json`.
* In default mode (`npm run eval`), a cache miss throws an error instructing the developer to run `npm run eval -- --live`.
* In live mode (`npm run eval -- --live`), the harness executes 3 complete passes over all 40 queries against the live Jev API to record `p50` and `p95` latencies, updates `eval/cache/`, and writes `eval/results/latest-report.md`.

### 8.2 Metric Definitions & Seeded Bootstrap (`eval/metrics.ts`, `17.4`)
* **NDCG@5:**
  $$\text{DCG}@5 = \sum_{i=1}^{\min(5, K)} \frac{2^{\text{rel}_i} - 1}{\log_2(i + 1)}, \quad \text{NDCG}@5 = \frac{\text{DCG}@5}{\text{IDCG}@5}$$
  *(Where $\text{IDCG}@5$ sorts the identical Stage 1 candidate pool by ground-truth label descending. Queries with all labels $= 0$ are excluded and counted separately.)*
* **MRR@5:** $\frac{1}{\text{rank}}$ of the first candidate in positions $1 \dots 5$ with $\text{label} \ge 2$, else $0$.
* **Recall@10:** $\frac{\vert{}\{\text{Stage 1 top 10 with label } \ge 2\}\vert{}}{\vert{}\{\text{All benchmark shops satisfying H1-H6 for query with label } \ge 2\}\vert{}}$.
* **95% Bootstrap Confidence Interval:**
  * Uses a deterministic Mulberry32 PRNG seeded with a fixed integer (`seed = 20261017`).
  * Draws $10,000$ resamples with replacement of size $N$ over the evaluated queries, computing $\Delta = \overline{B} - \overline{A}$ for each resample.
  * Reports the $2.5\text{th}$ and $97.5\text{th}$ percentiles.

---

## 9. Deployment, Configuration & Operations

### 9.1 Environment Variables (`src/config.ts`, `15`)

```ini
# Required
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shopfront
APP_BASE_URL=http://localhost:3000

# Runtime & Visibility
NODE_ENV=development
SHOW_SAMPLE_DATA=false

# Stage 2 Reranker (Jev)
RERANK_ENABLED=false
JEV_API_BASE_URL=[https://api.typesafe.ai/v1/decisions](https://api.typesafe.ai/v1/decisions)
JEV_API_KEY=
JEV_MODEL=jev-1.13-20260917

# Budgets & Thresholds
JEV_TIMEOUT_MS=450
TOTAL_BUDGET_MS=700
STAGE1_TIMEOUT_MS=250
ITEM_MATCH_THRESHOLD=0.15
CANDIDATE_POOL_SIZE=200
CANDIDATE_COUNT=10

# Rate Limiting & Operations
PUBLIC_RATE_LIMIT_PER_MIN=60
TRUST_PROXY=false
LOG_RETENTION_DAYS=90
```

### 9.2 `docker-compose.yml` Specification (`15`, `D16`)

```yaml
services:
  db:
    image: postgis/postgis:15-3.4
    container_name: shopfront-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-shopfront}
      TZ: Asia/Kolkata
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d shopfront"]
      interval: 5s
      timeout: 3s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: shopfront-app
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    env_file:
      - .env
    environment:
      TZ: Asia/Kolkata
    ports:
      - "127.0.0.1:3000:3000"
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/api/health || exit 1"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  pgdata:
```

### 9.3 Scheduled Maintenance & Backup Architecture (`N5`, `N6`)
Configured on the Linux host crontab (`/etc/cron.d/shopfront`):
```cron
# Purge search_logs older than LOG_RETENTION_DAYS (90 days) daily at 02:15 IST
15 2 * * * root docker exec shopfront-app npm run purge-logs >> /var/log/shopfront-purge.log 2>&1

# Nightly pg_dump backup at 03:00 IST, retaining 7 days
0 3 * * * root docker exec shopfront-db pg_dump -U postgres -Fc shopfront > /var/backups/shopfront/shopfront_$(date +\%F).dump && find /var/backups/shopfront/ -name "shopfront_*.dump" -mtime +7 -delete
```