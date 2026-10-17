# Shopfront Operations & Disaster Recovery Runbook

**Document Version:** 1.0.0  
**Target System:** Shopfront Hyperlocal Retail Engine & MCP Server  
**PRD Alignment:** Sections 16, 19, 21.1 (`N3`, `N4`, `N5`, `N6`)  
**Verified On:** Linux (Ubuntu/Debian) with Docker Compose, PostGIS 16-3.4, Node.js 22  

---

## 1. Operational Overview & Architecture

Shopfront is deployed via Docker Compose running two primary services:
- **`app` (`shopfront-app`):** Node.js 22 LTS container running Next.js 15 in standalone production mode, binding to `127.0.0.1:3000`. Exposes Web UI, Server Actions, REST search API, MCP SSE endpoint, and `/api/health`.
- **`db` (`shopfront-db`):** PostgreSQL 16 with PostGIS 3.4 (`postgis/postgis:16-3.4`) on port 5432 (mapped to host `127.0.0.1:5434`), using persistent named volume `pgdata`.

---

## 2. Service Management Commands

All service lifecycle operations should be executed from the application root directory (`/home/jeeva/project1-mcp`):

```bash
# Start all services in detached mode
docker compose up -d

# View real-time aggregated service logs
docker compose logs -f

# Check container health and status
docker compose ps

# Graceful restart of services
docker compose restart

# Graceful shutdown (preserves data in pgdata volume)
docker compose down

# Rebuild containers after code updates
docker compose build --no-cache && docker compose up -d
```

---

## 3. Scheduled Maintenance & Crontab Setup (`N5`, `N6`)

Host-level cron jobs are configured in `/etc/cron.d/shopfront` to automate log purging and database backups.

### 3.1 Host Crontab File (`/etc/cron.d/shopfront`)

Create or update `/etc/cron.d/shopfront` with the following schedule:

```cron
# /etc/cron.d/shopfront
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# 1. Purge search_logs older than LOG_RETENTION_DAYS (90 days) daily at 02:15 IST (20:45 UTC)
15 2 * * * root docker exec shopfront-app npm run purge-logs >> /var/log/shopfront/purge.log 2>&1

# 2. Nightly pg_dump backup at 03:00 IST (21:30 UTC), retaining 7 days of snapshots
0 3 * * * root /usr/local/bin/shopfront-backup.sh >> /var/log/shopfront/backup.log 2>&1
```

Ensure log and backup directories exist with appropriate permissions:
```bash
sudo mkdir -p /var/log/shopfront /var/backups/shopfront
sudo chmod 750 /var/backups/shopfront
```

---

## 4. Automated Backup Procedure (`N6`)

### 4.1 Backup Script (`/usr/local/bin/shopfront-backup.sh`)

Install the backup script to `/usr/local/bin/shopfront-backup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/shopfront"
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/shopfront_${DATE}.dump"
CONTAINER_NAME="shopfront-db"
DB_NAME="shopfront"
DB_USER="postgres"

echo "[$(date -Iseconds)] Starting Shopfront database backup..."

# Execute pg_dump using PostgreSQL custom format (-Fc) with built-in zlib compression
docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -Fc "${DB_NAME}" > "${BACKUP_FILE}"

# Verify backup file size is non-zero
FILE_SIZE=$(stat -c%s "${BACKUP_FILE}")
if [ "${FILE_SIZE}" -lt 1024 ]; then
  echo "[$(date -Iseconds)] ERROR: Backup file size (${FILE_SIZE} bytes) is suspiciously small!" >&2
  exit 1
fi

echo "[$(date -Iseconds)] Backup successfully created: ${BACKUP_FILE} (${FILE_SIZE} bytes)"

# Retention: Remove dumps older than 7 days
echo "[$(date -Iseconds)] Cleaning backups older than 7 days..."
find "${BACKUP_DIR}" -type f -name "shopfront_*.dump" -mtime +7 -delete

echo "[$(date -Iseconds)] Backup routine completed successfully."
```

Make the script executable:
```bash
sudo chmod +x /usr/local/bin/shopfront-backup.sh
```

---

## 5. Tested Disaster Recovery & Restore Runbook

The restoration procedure was executed and verified against a test database before launch.

### 5.1 Verification Status
- **Test Date:** 2026-10-18
- **Source Database:** `shopfront` (PostgreSQL 16 / PostGIS 3.4)
- **Target Verification DB:** `shopfront_restore_test`
- **Result:** **PASSED** (50 shops, 32 localities, geometry columns, constraints, and relational schemas restored with 100% integrity).

### 5.2 Step-by-Step Recovery Procedure

In the event of database corruption, data loss, or server migration, follow this procedure:

#### Step 1: Locate Most Recent Valid Backup
```bash
ls -lht /var/backups/shopfront/shopfront_*.dump | head -n 5
LATEST_BACKUP=$(ls -t /var/backups/shopfront/shopfront_*.dump | head -n 1)
echo "Restoring from: ${LATEST_BACKUP}"
```

#### Step 2: Terminate Existing Connections & Reset Database
Before restoring, terminate any active application connections to prevent deadlocks:

```bash
docker exec -i shopfront-db psql -U postgres -c "
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE datname = 'shopfront' AND pid <> pg_backend_pid();
"
```

Drop and recreate the target database:
```bash
docker exec -i shopfront-db psql -U postgres -c "DROP DATABASE IF EXISTS shopfront;"
docker exec -i shopfront-db psql -U postgres -c "CREATE DATABASE shopfront;"
```

#### Step 3: Restore Database from Custom Dump (`pg_restore`)
Pipe the compressed custom dump directly into `pg_restore`:

```bash
cat "${LATEST_BACKUP}" | docker exec -i shopfront-db pg_restore -U postgres -d shopfront --no-owner --role=postgres
```

*(Note: `pg_restore` returns 0 on complete restore. Any non-fatal warnings regarding public schema privileges can be safely ignored).*

#### Step 4: Verify Data Integrity Post-Restore
Run integrity checks to confirm tables and PostGIS spatial columns are operational:

```bash
docker exec -i shopfront-db psql -U postgres -d shopfront -c "
  SELECT 'shops' AS table_name, COUNT(*) FROM shops
  UNION ALL
  SELECT 'localities', COUNT(*) FROM localities
  UNION ALL
  SELECT 'catalog_items', COUNT(*) FROM catalog_items
  UNION ALL
  SELECT 'users', COUNT(*) FROM users
  UNION ALL
  SELECT 'audit_logs', COUNT(*) FROM audit_logs;
"
```

Verify PostGIS spatial queries execute correctly:
```bash
docker exec -i shopfront-db psql -U postgres -d shopfront -c "
  SELECT id, name, ST_AsText(location) 
  FROM shops 
  WHERE location IS NOT NULL 
  LIMIT 3;
"
```

#### Step 5: Restart Application & Verify Health Check
```bash
docker compose restart app
curl -s http://localhost:3000/api/health
# Expected Output: {"status":"ok","timestamp":"..."}
```

---

## 6. Observability & Monitoring

### 6.1 Database & Service Health Check (`/api/health`)
- **Endpoint:** `GET /api/health`
- **Behavior:** Issues `SELECT 1;` through the PostgreSQL connection pool.
- **Responses:**
  - `HTTP 200 OK`: `{"status":"ok","timestamp":"2026-10-18T00:00:00.000Z"}`
  - `HTTP 503 Service Unavailable`: `{"status":"error","error":"connection failed"}`

### 6.2 Structured JSON Logging (`src/logger.ts`)
All application events and access requests output structured JSON to standard output. Example format:
```json
{
  "level": "info",
  "time": "2026-10-18T01:00:00.000Z",
  "message": "Search executed",
  "route": "/api/search",
  "channel": "web",
  "duration_ms": 42
}
```
Sensitive information (passwords, session cookies, auth tokens, API keys) is automatically redacted recursively via `redactSensitiveData()`.

### 6.3 Telemetry & Search Logs Viewer
Admins can inspect query performance, candidate counts, Stage 2 reranker rates, fallback rates, and p50/p95 latency in real time via:
- **Admin UI:** `https://<domain>/admin/logs`
- **CSV Export:** `https://<domain>/api/admin/logs/export`

---

## 7. Incident Response Runbook

### Incident A: Database Connection Errors (HTTP 503 on `/api/health`)
1. **Inspect DB Container Logs:**
   ```bash
   docker logs --tail 100 shopfront-db
   ```
2. **Check Container Status:**
   ```bash
   docker inspect --format='{{.State.Health.Status}}' shopfront-db
   ```
3. **If Out of Connections:**
   Check active connections:
   ```bash
   docker exec -i shopfront-db psql -U postgres -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
   ```
   Restart connection pool by restarting app:
   ```bash
   docker compose restart app
   ```

### Incident B: Stage 2 Reranker Latency Spike
- **Symptom:** Search queries experiencing high latency or fallback logs (`fallback_reason = 'budget'` or `'timeout'`).
- **Remediation:**
  - The system is architected with **Fail-Open Fallback**. If Jev Decisions API fails or times out, the search automatically returns Stage 1 results without breaking the user journey.
  - To disable Stage 2 entirely under heavy load, set `RERANK_ENABLED=false` in `.env` and restart `app`:
    ```bash
    docker compose restart app
    ```

### Incident C: High Rate-Limiting Violations (HTTP 429)
- **Symptom:** Multiple 429 errors in `/var/log/shopfront/` or `/admin/logs`.
- **Diagnosis:** Filter search logs for `error_code = 'rate_limited'` on `/admin/logs` to identify offending IP addresses.
- **Action:** If legitimate traffic is hitting the default limit of 60 req/min, tune rate limits in `src/rate-limit.ts`.
