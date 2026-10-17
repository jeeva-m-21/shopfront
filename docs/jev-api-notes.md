# Jev Decisions API — Integration Contract & Latency Notes

**Milestone:** M0 (Frozen Specification)  
**Provider:** TypeSafe Jev Decisions API  
**Target Endpoint:** `https://api.typesafe.ai/v1/decisions`  
**Governing PRD Decisions:** D1 (Latency Budget), D6 (Rubric Levels), D14 (All-or-Nothing Fallback), D17 (Frozen Provider Contract)

---

## 1. Provider Overview & Guarantees

TypeSafe Jev is a specialized decision model service providing probability distributions over discrete ordinal levels. Shopfront uses Jev strictly in **Stage 2** of the search engine to judge menu-to-query relevance for the top 10 candidates retrieved by PostgreSQL Stage 1.

> [!IMPORTANT]
> Jev is a beta service. Shopfront is engineered to fail open: if Jev is unreachable, slow, disabled, or returns malformed output, the system seamlessly returns Stage 1 results with `reranked: false`.

---

## 2. Request Specification

### 2.1 HTTP Request
- **Method:** `POST`
- **URL:** `${config.JEV_API_BASE_URL}` (Default: `https://api.typesafe.ai/v1/decisions`)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer ${config.JEV_API_KEY}`

### 2.2 Payload Schema
```json
{
  "model": "jev-1.13-20260917",
  "question": "On a scale of 0 to 3, how well does this shop's menu offer what the customer is asking for?",
  "levels": [0, 1, 2, 3],
  "state": {
    "customer_query": "<query truncated to 200 chars>",
    "shop": {
      "name": "<name truncated to 80 chars>",
      "category": "repair_service",
      "description": "<description truncated to 300 chars>",
      "items": [
        {
          "name": "<item name truncated to 80 chars>",
          "description": "<item description truncated to 160 chars or null>",
          "tags": ["<up to 5 tags, each <= 30 chars>"]
        }
      ]
    }
  }
}
```

### 2.3 Prompt Injection & Leakage Guards (PRD Section 12.3)
1. **Truncation Limits:**
   - `customer_query`: $\le 200$ characters.
   - `shop.name`: $\le 80$ characters.
   - `shop.description`: $\le 300$ characters.
   - `items`: At most 5 items from Stage 1 top matching items.
   - `item.name`: $\le 80$ characters.
   - `item.description`: $\le 160$ characters.
   - `item.tags`: At most 5 tags, each $\le 30$ characters.
2. **Explicit Exclusions:**
   - **Never sent to Jev:** Prices (`price_inr`, `price_max_inr`), distances, coordinates, and opening hours.
   - All text inputs have ASCII control characters stripped and excess whitespace collapsed.

---

## 3. Response Specification & Validation Contract

### 3.1 Expected Response Body
```json
{
  "model": "jev-1.13-20260917",
  "distribution": [
    { "level": 0, "probability": 0.05 },
    { "level": 1, "probability": 0.10 },
    { "level": 2, "probability": 0.25 },
    { "level": 3, "probability": 0.60 }
  ]
}
```

### 3.2 Invariant Verification Rules
Every response must satisfy:
1. HTTP status code is `2xx`.
2. Distribution contains exactly 4 entries for levels `0, 1, 2, 3`.
3. Every probability $P(i) \ge 0.0$.
4. Total probability sums to $1.0$:
   $$| \sum_{i=0}^3 P(i) - 1.0 | \le 0.01$$

If any candidate response fails these rules, the entire reranking pass is aborted and Stage 1 order is returned with `fallback_reason: 'invalid_schema'`.

---

## 4. Relevance Score Calculation

1. **Expected Score:**
   $$E[\text{score}] = 0 \cdot P(0) + 1 \cdot P(1) + 2 \cdot P(2) + 3 \cdot P(3)$$
   The resulting value is in the range $[0.00, 3.00]$.

2. **Tie-Breaking Order:**
   - Sort descending by expected score rounded to 4 decimals: `Math.round(expectedScore * 10000) / 10000`.
   - If tied, preserve Stage 1 order by tie-breaking on `baseline_rank ASC`.

3. **Public API Output Formatting:**
   - Serialized as `relevance_score` rounded to 2 decimals: `Math.round(expectedScore * 100) / 100`.

---

## 5. Latency Budgets & Timeout Architecture

| Component | Timeout / Budget | Enforced By | Fallback Action on Violation |
| :--- | :--- | :--- | :--- |
| **Total `find_shops`** | 700 ms budget | Node.js `AbortController` / monotonic clock | Return Stage 1 results before reaching 800 ms p95 |
| **Stage 1 (PostgreSQL)** | 250 ms statement timeout | `SET LOCAL statement_timeout = 250` | Re-throws error, returns `internal_error` |
| **Stage 2 (Jev API)** | 450 ms request timeout | `AbortController.timeout(jevTimeoutMs)` | Aborts all parallel requests, returns Stage 1 order |

### 5.1 Dynamic Timeout Computation
Before dispatching parallel Jev requests:
```typescript
const elapsedMs = performance.now() - startTime;
const jevTimeoutMs = Math.min(config.JEV_TIMEOUT_MS, config.TOTAL_BUDGET_MS - elapsedMs - 30);

if (jevTimeoutMs < 150) {
  // Budget exhausted; skip Jev entirely
  return { reranked: false, fallback_reason: 'budget' };
}
```

---

## 6. Offline Evaluation Cache Specification (`eval/cache/`)

To support deterministic, zero-network execution of `npm run eval`:
1. **Cache Key:**
   $$\text{SHA-256}(\text{JSON.stringify}(\{ \text{model}, \text{state}, \text{question} \}))$$
2. **Storage Location:** `eval/cache/${cacheKey}.json`
3. **Execution Modes:**
   - Default (`npm run eval`): Cache-only mode. Throws error if key is missing.
   - Live (`npm run eval -- --live`): Executes 3 live passes against Jev API, updates cache, and records live p50/p95 latency metrics in `eval/results/latest-report.md`.
