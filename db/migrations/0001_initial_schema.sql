-- Migration: 0001_initial_schema.sql
-- Description: Authoritative Shopfront schema contract per PRD v2.0 Section 6 and Architecture Section 3.2

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'owner');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE shop_category AS ENUM ('repair_service', 'salon_wellness', 'food_beverage');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE shop_status AS ENUM ('draft', 'live', 'paused');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE hours_status AS ENUM ('unknown', 'set');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE item_kind AS ENUM ('product', 'service');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE price_type AS ENUM ('fixed', 'starting_from', 'range', 'on_request');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE action_mode AS ENUM ('whatsapp', 'external_url', 'phone_only');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE diet_type AS ENUM ('veg', 'non_veg', 'vegan', 'egg');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Localities (exactly 32 rows, seeded)
CREATE TABLE IF NOT EXISTS localities (
  id       SMALLSERIAL PRIMARY KEY,
  name     TEXT NOT NULL UNIQUE,
  aliases  TEXT[] NOT NULL DEFAULT '{}',
  center   GEOGRAPHY(Point, 4326) NOT NULL
);

-- 2. Users (admins and owners)
CREATE TABLE IF NOT EXISTS users (
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

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. Sessions (token stored hashed)
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,                 -- SHA-256 hex of the cookie token
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);

-- 4. Login attempts (for lockout)
CREATE TABLE IF NOT EXISTS login_attempts (
  id         BIGSERIAL PRIMARY KEY,
  username   TEXT NOT NULL,
  succeeded  BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_time ON login_attempts (username, created_at DESC);

-- 5. Shops
CREATE TABLE IF NOT EXISTS shops (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  slug                TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{3,60}$'),
  name                TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  category            shop_category NOT NULL,
  description         TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 500),
  address             TEXT NOT NULL CHECK (char_length(address) BETWEEN 5 AND 200),
  locality_id         SMALLINT NOT NULL REFERENCES localities(id),
  location            GEOGRAPHY(Point, 4326) NOT NULL,      -- the only stored position
  phone               TEXT NOT NULL CHECK (phone ~ '^\+91\d{10}$'),
  whatsapp            TEXT CHECK (whatsapp IS NULL OR whatsapp ~ '^\+91[6-9]\d{9}$'),
  booking_url         TEXT CHECK (booking_url IS NULL OR booking_url ~ '^https://\S+$'),
  website_url         TEXT CHECK (website_url IS NULL OR website_url ~ '^https://\S+$'),
  action_mode         action_mode NOT NULL,
  action_instructions TEXT CHECK (action_instructions IS NULL OR char_length(action_instructions) <= 200),
  is_sample_data      BOOLEAN NOT NULL,                      -- no default, must be explicit
  data_source_note    TEXT,
  status              shop_status NOT NULL DEFAULT 'draft',
  admin_locked        BOOLEAN NOT NULL DEFAULT FALSE,        -- TRUE: owner cannot resume
  hours_status        hours_status NOT NULL DEFAULT 'unknown',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (action_mode <> 'whatsapp'     OR whatsapp    IS NOT NULL),
  CHECK (action_mode <> 'external_url' OR booking_url IS NOT NULL),
  CHECK (NOT is_sample_data OR data_source_note IS NOT NULL)
);

DROP TRIGGER IF EXISTS trg_shops_updated ON shops;
CREATE TRIGGER trg_shops_updated BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_shops_location_gist ON shops USING GIST (location) WHERE status = 'live';
CREATE INDEX IF NOT EXISTS idx_shops_category      ON shops (category)            WHERE status = 'live';
CREATE INDEX IF NOT EXISTS idx_shops_search_trgm   ON shops USING GIN ((name || ' ' || description) gin_trgm_ops);

-- 6. Weekly hours. weekday: 0 = Monday ... 6 = Sunday.
CREATE TABLE IF NOT EXISTS shop_hours (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id    UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  weekday    SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  open_time  TIME NOT NULL,
  close_time TIME NOT NULL,
  CHECK (open_time <> close_time)
);
CREATE INDEX IF NOT EXISTS idx_shop_hours_shop_day ON shop_hours (shop_id, weekday);

-- 7. One-off closures (whole calendar day)
CREATE TABLE IF NOT EXISTS shop_closures (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id   UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  closed_on DATE NOT NULL,
  reason    TEXT CHECK (reason IS NULL OR char_length(reason) <= 100),
  UNIQUE (shop_id, closed_on)
);

-- 8. Catalog items
CREATE TABLE IF NOT EXISTS catalog_items (
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
  search_text   TEXT NOT NULL DEFAULT '',                  -- maintained by trigger (D8)
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

CREATE OR REPLACE FUNCTION catalog_items_before_write() RETURNS trigger AS $$
BEGIN
  NEW.search_text := lower(
    NEW.name || ' ' || COALESCE(NEW.description, '') || ' ' || array_to_string(NEW.tags, ' ')
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_catalog_items_write ON catalog_items;
CREATE TRIGGER trg_catalog_items_write BEFORE INSERT OR UPDATE ON catalog_items
  FOR EACH ROW EXECUTE FUNCTION catalog_items_before_write();

CREATE INDEX IF NOT EXISTS idx_catalog_items_shop ON catalog_items (shop_id, available, price_inr);
CREATE INDEX IF NOT EXISTS idx_catalog_items_trgm ON catalog_items USING GIN (search_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_catalog_items_fts  ON catalog_items USING GIN (to_tsvector('english', search_text));

-- 9. Audit log (every create/update/delete in portals)
CREATE TABLE IF NOT EXISTS audit_log (
  id             BIGSERIAL PRIMARY KEY,
  actor_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_username TEXT NOT NULL,
  action         TEXT NOT NULL,        -- e.g. 'shop.update', 'item.create', 'owner.disable'
  entity_type    TEXT NOT NULL,
  entity_id      TEXT NOT NULL,
  before_data    JSONB,
  after_data     JSONB,               -- never contains password hashes or temporary passwords
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_time ON audit_log (created_at DESC);

-- 10. Search and tool telemetry
CREATE TABLE IF NOT EXISTS search_logs (
  id               BIGSERIAL PRIMARY KEY,
  channel          TEXT NOT NULL CHECK (channel IN ('mcp', 'web')),
  tool             TEXT NOT NULL,
  query_text       TEXT,
  locality_id      SMALLINT,
  category         shop_category,
  shop_id          UUID,                 -- set for get_shop_info, get_catalog, search_catalog, get_action_link
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
CREATE INDEX IF NOT EXISTS idx_search_logs_time ON search_logs (created_at DESC);
