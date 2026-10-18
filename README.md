# 🏪 Shopfront: Local Shops, Found by AI

> **“Be the answer when people ask AI.”**  
> *Shopfront makes local businesses visible to AI assistants through the open Model Context Protocol (MCP).*

---

<!-- Badges & Production Metrics -->
<div align="center">

[![Production Status](https://img.shields.io/badge/Production-Live-0E6B66?style=for-the-badge&logo=vercel&logoColor=white)](https://shopfront-rouge.vercel.app)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-io.github.jeeva--m--21%2Fshopfront-F4B000?style=for-the-badge&logo=anthropic&logoColor=black)](https://github.com/modelcontextprotocol/registry)
[![Technical Case Study](https://img.shields.io/badge/Architecture-Case_Study-0E6B66?style=for-the-badge&logo=readme&logoColor=white)](TECHNICAL_CASE_STUDY.md)
[![Test Gates](https://img.shields.io/badge/Vitest-234%2F234_Passing-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)]()
[![Playwright E2E](https://img.shields.io/badge/Playwright-E2E_Verified-45ba4b?style=for-the-badge&logo=playwright&logoColor=white)]()

<br/>

[![TypeScript 5.8](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)]()
[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js&logoColor=white)]()
[![PostgreSQL 16 / PostGIS 3.4](https://img.shields.io/badge/PostGIS-3.4-336791?logo=postgresql&logoColor=white)]()
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.0-38B2AC?logo=tailwindcss&logoColor=white)]()
[![Docker Ready](https://img.shields.io/badge/Docker-Node_22_Slim-2496ED?logo=docker&logoColor=white)]()
[![Zero ORM](https://img.shields.io/badge/Data_Layer-Zero_ORM-orange)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]()

</div>

---

## ⚡ Quick Links & Live Demos

| Resource | Direct Link | Description |
|:---|:---|:---|
| 🌐 **Live Web Application** | [shopfront-rouge.vercel.app](https://shopfront-rouge.vercel.app) | Real-time discovery portal with verified Chennai merchant ledgers. |
| 🤖 **AI Agent Connect Portal** | [shopfront-rouge.vercel.app/connect](https://shopfront-rouge.vercel.app/connect) | 60-second MCP setup for Claude Desktop, Cursor, and custom agent sidecars. |
| 🎨 **Brand & Vector Assets** | [shopfront-rouge.vercel.app/brand](https://shopfront-rouge.vercel.app/brand) | Official Stitch multi-view SVG logo system, typography, and color tokens. |
| 📖 **Technical Architecture Case Study** | [`TECHNICAL_CASE_STUDY.md`](TECHNICAL_CASE_STUDY.md) | Exhaustive problem-to-solution system design, PostGIS spatial indexing, and security architecture. |
| 🔌 **Streamable HTTP MCP Endpoint** | `POST https://shopfront-rouge.vercel.app/api/mcp` | RFC-compliant Model Context Protocol streamable transport for agents. |

---

## 📋 Table of Contents

1. [The Core Novelty & Positioning](#1-the-core-novelty--positioning)
2. [The Breakdown of Urban Apps vs. The AI Shift](#2-the-breakdown-of-urban-apps-vs-the-ai-shift)
3. [The Solution: Three Key Differentiators](#3-the-solution-three-key-differentiators)
4. [Deep Customization: You Decide What AI Says](#4-deep-customization-you-decide-what-ai-says)
5. [System Architecture & Request Lifecycle](#5-system-architecture--request-lifecycle)
6. [Live Endpoints & Model Context Protocol (MCP) Tools](#6-live-endpoints--model-context-protocol-mcp-tools)
7. [Connect to AI Assistants (Claude, Cursor, ChatGPT)](#7-connect-to-ai-assistants-claude-cursor-chatgpt)
8. [Design System: "The Shutter Goes Up"](#8-design-system-the-shutter-goes-up)
9. [Scientific Offline Evaluation & Benchmarks](#9-scientific-offline-evaluation--benchmarks)
10. [Local Development & Test Gates](#10-local-development--test-gates)

---

## 1. The Core Novelty & Positioning

> **One line:** Shopfront makes local businesses visible to AI assistants.  
> **Tagline:** *“Be the answer when people ask AI.”*  
> **Short form:** *“Local shops, found by AI.”*

```
┌────────────────────────────────────────────────────────────────────────┐
│  CUSTOMER ASKS AI:                                                     │
│  "Where can I get my iPhone battery replaced in Adyar right now under  │
│   ₹2,000?"                                                             │
├────────────────────────────────────────────────────────────────────────┤
│  WITHOUT SHOPFRONT:                                                    │
│  ❌ "I don't have real-time access to local shops or current prices.  │
│      You may want to check Google Maps or call nearby stores."         │
├────────────────────────────────────────────────────────────────────────┤
│  WITH SHOPFRONT (MCP):                                                 │
│  ✅ "I found A1 Electronics in Adyar (450m away). They are open right  │
│      now (verified 9m ago). Their iPhone Battery Replacement is        │
│      ₹1,800. Click here to chat with the owner on WhatsApp: wa.me/..." │
└────────────────────────────────────────────────────────────────────────┘
```

Shopfront bridges the gap between physical urban retail and conversational intelligence. By turning neighborhood shops into queryable, authenticated nodes on the Model Context Protocol (MCP), merchants gain direct customer inquiries without building custom mobile apps or forfeiting 30% aggregator commissions.

---

## 2. The Breakdown of Urban Apps vs. The AI Shift

Urban commerce is experiencing a structural paradigm shift driven by consumer app fatigue and conversational AI:

```mermaid
flowchart TD
    subgraph TheAppTrap["The Separate Franchise App & Marketplace Trap"]
        A1["Separate App per Franchise<br/>(McDonald's app, Domino's app, Swiggy, Zomato, Urban Company)"]
        A2["Severe App Fatigue<br/>(Users delete single-use apps; refuse to install 30 separate apps)"]
        A3["20% to 30% Aggregator Commissions<br/>(High take-rates erode independent merchant margins)"]
        A4["Walled-Garden Data Silos<br/>(Customer phone numbers masked; zero direct relationship)"]
        A1 --> A2 --> A3 --> A4
    end

    subgraph TheAIShift["The Conversational AI Revolution"]
        B1["Users Ask AI Instead of Opening Apps<br/>('Find me a MacBook technician near Adyar')"]
        B2["AI Assistants Get ZERO Data<br/>(LLMs cannot read fragmented closed apps)"]
        B3["Result: Hallucinated defunct numbers or dead ends"]
        B1 --> B2 --> B3
    end

    TheAppTrap -.->|Broken Paradigm| Solution["Shopfront: The Authoritative Live Layer"]
    TheAIShift -.->|Needs Ground Truth| Solution
```

### The Three Critical Industry Breakdown Points:
1. **App Fatigue:** Customers do not want to download, register, and update 30 different mobile apps for every local bakery, barber, and motorcycle garage.
2. **The Aggregator Tax:** Conventional aggregators extract 20% to 30% of gross transaction volume and mask customer identities, preventing merchants from building long-term loyalty.
3. **The AI Search Blind Spot:** When consumers ask Claude, Cursor, or ChatGPT for local recommendations, LLMs hallucinate or return generic blog scrapes because brick-and-mortar stores have no standard API or protocol representation.

---

## 3. The Solution: Three Key Differentiators

Shopfront replaces the fragmented app nightmare with a unified, protocol-driven architecture:

| Differentiator | Traditional Aggregators & Franchise Apps | Shopfront (MCP Engine) |
|:---|:---|:---|
| **1. AI-Native Protocol** | ❌ Walled gardens; closed to AI assistants; invisible to conversational search. | ✅ **Native Model Context Protocol (MCP)** server readable by Claude, Cursor, ChatGPT, and custom agent sidecars. |
| **2. One Listing vs. 20 Apps** | ❌ Merchants spend ₹1,50,000+ building custom apps that users immediately uninstall. | ✅ **One low-cost, commission-free listing** that automatically syndicates across all AI assistants. |
| **3. Owner-Controlled Direct Contact** | ❌ Masked phone numbers; platform lock-in; delayed weekly payouts. | ✅ **Direct WhatsApp & telephone connection** with pre-filled enquiry templates. Merchants keep 100% of revenue. |

---

## 4. Deep Customization: You Decide What AI Says

Shopfront provides local merchants with absolute sovereignty over their data. Through the mobile-first Owner Portal, owners decide exactly what AI assistants know and recommend:

```mermaid
mindmap
  root((Owner Customization))
    Hours & Shift Breaks
      Real-time IST schedule
      Afternoon lunch breaks
      Temple & festival closures
    Exact Rupee Pricing
      Fixed menu prices
      Transparent price ranges
      Warranty terms
    Live Availability
      1-thumb out-of-stock switches
      Capacity limits
    Service Area & Coordinates
      Millimeter PostGIS location
      Locality bounding polygon
    Craftsmanship & Story
      20+ years experience
      Specialist certifications
    WhatsApp Opening Template
      Pre-filled item context
      Direct wa.me deep links
    Bilingual Localization
      Tamil keywords ஷாப்ஃபிரண்ட்
      English terminology
```

### The 8 Signature Customization Levers:
- **1. Operating Shifts & Lunch Breaks:** Configure discrete shift intervals (e.g. 09:00–13:00 and 16:30–21:30) and upcoming holiday dates. AI never sends customers to a closed shutter.
- **2. Exact Rupee Pricing:** List precise prices (e.g. *iPhone Battery: ₹1,800*) to qualify high-intent customers and eliminate haggling.
- **3. Instant Availability Toggle:** Flip an item unavailable with a single thumb-tap from your phone when parts run out. AI updates immediately.
- **4. Spatial Service Area:** Pinpoint exact physical coordinates and service radiuses in PostGIS (SRID 4326).
- **5. Authentic Brand Story:** Provide background on your techniques, heritage, and quality guarantees for AI to champion.
- **6. Pre-Formatted WhatsApp Message:** Customize the greeting message generated when customers click your action link.
- **7. Bilingual Tamil & English Support:** Enable native Tamil script matching alongside standard English.
- **8. Persistent "AI Preview":** A live dashboard card in the Owner Portal showing the exact conversational response and raw MCP JSON that AI assistants receive.

---

## 5. System Architecture & Request Lifecycle

Shopfront combines sub-25ms PostGIS SQL retrieval with an LLM semantic decision reranker and a fail-open circuit breaker.

```mermaid
flowchart TB
    subgraph Ingress["1. Ingress Layer"]
        User["🌐 Customer Browser<br/>Next.js 15 App"]
        Agent["🤖 AI Agent (Claude Desktop)<br/>Streamable HTTP / Stdio"]
        Merchant["📱 Shop Owner<br/>Mobile Web Portal"]
    end

    subgraph SecurityLayer["2. Gateway Security & Auth"]
        RateLimit["⏱️ Sliding Window Rate Limiter<br/>(60 req/min)"]
        CSRF["🛡️ CSRF & Origin Guard<br/>(Sec-Fetch-Site Check)"]
        Argon["🔐 Argon2id (m=64MB, t=3, p=1)<br/>SHA-256 Session Token Hash"]
    end

    subgraph SearchPipeline["3. Two-Stage Retrieval Pipeline"]
        Stage1["⚡ Stage 1: PostGIS Fast SQL<br/>• Spatial Radius & Bounding Box (H1)<br/>• Live Status & Admin Lock Checks (H2)<br/>• IST Temporal Shift Matching (H6)<br/>• Statement Timeout: 250ms"]
        
        Sanitizer["🧹 Prompt Injection Stripper<br/>• Strip ASCII Control Chars<br/>• Exclude GPS coords, prices, hours"]
        
        Stage2["🧠 Stage 2: Jev Decisions LLM Reranker<br/>• Parallel Candidate Scoring<br/>• Expected Score E[score] Formulation<br/>• Strict Time Budget: min(timeout, rem-30ms)"]
        
        FailOpen["⚡ Fail-Open Circuit Breaker<br/>(On timeout/fault -> Fallback to Stage 1)"]
    end

    subgraph Storage["4. Authoritative Database (PostgreSQL 16 + PostGIS 3.4)"]
        PGPool["🐘 Dedicated Connection Pool (Zero ORM)"]
        Shops[("shops & localities<br/>Spatial GIST Index")]
        Catalog[("catalog_items<br/>Available Offerings")]
        Shifts[("operating_shifts<br/>IST Intervals")]
    end

    User --> RateLimit --> Stage1
    Agent --> RateLimit --> Stage1
    Merchant --> CSRF --> Argon --> PGPool

    Stage1 --> PGPool
    PGPool --> Shops
    PGPool --> Catalog
    PGPool --> Shifts

    Stage1 -->|Top 10 Candidates| Sanitizer
    Sanitizer --> Stage2
    Stage2 -.->|Timeout / Error| FailOpen
    FailOpen --> Output["📱 Verified WhatsApp Action Link"]
    Stage2 -->|Reranked Output| Output
```

---

## 6. Live Endpoints & Model Context Protocol (MCP) Tools

Shopfront implements the **Model Context Protocol (MCP 1.32.1)** specification over Web Standard Streamable HTTP (`POST /api/mcp`) and local Stdio (`scripts/mcp-stdio.ts`).

### Official MCP Registry Listing:
```
io.github.jeeva-m-21/shopfront
```

### The 5 Core MCP Tools:
| Tool Name | Parameters | Description |
|:---|:---|:---|
| `find_shops` | `category?`, `locality?`, `latitude?`, `longitude?`, `radius_km?`, `query?`, `max_price_inr?`, `open_now?` | Discovers and ranks Chennai shops matching physical, budget, and operational constraints. |
| `get_shop_info` | `shop_id` or `slug` | Retrieves complete shop profile, physical address, locality coordinates, weekly operating shifts, and upcoming 30-day closures. |
| `get_catalog` | `shop_id`, `cursor?`, `limit?` | Fetches available menu offerings and service rates grouped by section with keyset pagination. |
| `search_catalog` | `shop_id`, `query`, `kind?`, `max_price_inr?`, `limit?` | Executes text similarity search within a specific shop's catalog. |
| `get_action_link` | `shop_id`, `item_id?`, `item_name?` | Generates verified WhatsApp deep-link (`wa.me`) or telephone link with pre-formatted enquiry message and disclaimer. |

---

## 7. Connect to AI Assistants (Claude, Cursor, ChatGPT)

You can connect Shopfront to your AI assistant in under 60 seconds.

### Option A: Claude Desktop (Local Stdio)
Add Shopfront to your `claude_desktop_config.json`:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "shopfront": {
      "command": "node",
      "args": [
        "--import",
        "tsx",
        "/absolute/path/to/shopfront/scripts/mcp-stdio.ts"
      ],
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres@localhost:5434/shopfront",
        "APP_BASE_URL": "https://shopfront-rouge.vercel.app",
        "STAGE1_TIMEOUT_MS": "250",
        "RERANK_ENABLED": "false"
      }
    }
  }
}
```

### Option B: Remote Streamable HTTP (Cursor / Web Agents)
In Cursor (`Settings` $\rightarrow$ `Features` $\rightarrow$ `MCP Servers`):
- **Type:** `command` or `sse` / `streamable-http`
- **URL:** `https://shopfront-rouge.vercel.app/api/mcp`

---

## 8. Design System: "The Shutter Goes Up"

The brand identity avoids generic SaaS gradients in favor of an authentic Chennai visual identity rooted in physical urban commerce: **the rolling metal shop shutter**.

<div align="center">

| Master View | Asset Preview | Spec |
|:---:|:---:|:---:|
| **01 / Primary Horizontal** | ![Horizontal Light](public/brand/logo-horizontal-light.svg) | 4:1 Lockup on Light Surface |
| **02 / Brand Hero** | ![Horizontal Dark](public/brand/logo-horizontal-dark.svg) | High-contrast on Marina Teal (`#0E6B66`) |
| **03 / Stacked Emblem** | ![Stacked Emblem](public/brand/logo-stacked.svg) | 1:1 Square Splash Emblem |
| **06 / App Icon Squircles** | ![App Icon](public/brand/app-icon-teal.svg) | 80×80 Squircle ($r = 25\%$) |

</div>

- **Marina Teal (`#0E6B66`):** Inspired by Marina Beach at dusk. Primary buttons, active indicators, and focus rings.
- **Motion Turmeric (`#F4B000`):** Single focal accent per screen. Used for the lifted top slat and live verified badges.
- **Stone Neutrals (`#FAF9F6` to `#100F0D`):** Warm paper-and-ink gray tones.
- **Explore All Assets:** Visit [shopfront-rouge.vercel.app/brand](https://shopfront-rouge.vercel.app/brand) to download standalone SVGs.

---

## 9. Scientific Offline Evaluation & Benchmarks

Shopfront incorporates a rigorous offline evaluation framework executing **40 golden benchmark queries** (30 Dev, 10 Held-out) across 4 query topologies:

```
┌────────────────────────────────────────────────────────────────────────┐
│  OFFLINE EVALUATION HARNESS RESULTS (eval/results/latest-report.md)     │
├────────────────────────────────┬───────────────┬───────────────────────┤
│ Metric                         │ Stage 1 SQL   │ Stage 2 LLM Reranked  │
├────────────────────────────────┼───────────────┼───────────────────────┤
│ Overall NDCG@5                 │ 0.8853        │ 0.8873 (+0.0020)      │
│ Direct Service NDCG@5          │ 0.8379        │ 0.8423 (+0.0044)      │
│ Specificity NDCG@5             │ 0.9176        │ 0.9210 (+0.0034)      │
│ Overall MRR@5                  │ 0.8000        │ 0.8000                │
│ Overall Recall@10              │ 1.0000        │ 1.0000                │
│ Inter-Annotator Agreement      │ Cohen's κ = 0.864 (90.0% agreement)   │
│ Latency P50 / P95              │ 22.4 ms / 147 ms                      │
│ 95% Confidence Intervals       │ 10,000-sample Mulberry32 Bootstrap    │
└────────────────────────────────┴───────────────┴───────────────────────┘
```

> **Read the full engineering deep dive in [`TECHNICAL_CASE_STUDY.md`](TECHNICAL_CASE_STUDY.md).**

---

## 10. Local Development & Test Gates

### Prerequisites
- Node.js 22+ (pinned via `.nvmrc`)
- PostgreSQL 16 with PostGIS 3.4 extension
- Docker & Docker Compose (optional for local DB)

### Setup & Run
```bash
# 1. Clone the repository
git clone https://github.com/your-username/shopfront.git
cd shopfront

# 2. Install pinned dependencies
npm ci

# 3. Environment configuration
cp .env.example .env

# 4. Start PostGIS container
docker-compose up -d db

# 5. Run database migrations & seed fixtures
npm run db:migrate
npm run db:seed

# 6. Execute native check gates (40 suites, 234 tests)
npm test

# 7. Execute Playwright E2E lifecycle test
npx playwright test

# 8. Run offline evaluation benchmark
npm run eval

# 9. Start development server
npm run dev
```

---

<div align="center">
  <sub>Crafted with engineering discipline for the streets of Chennai and the global agentic AI ecosystem.</sub>
</div>
