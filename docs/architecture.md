# Architecture

This document describes the high-level architecture of TribeMem, its components, data flow, and key design decisions.

---

## System Overview

```
                          ┌─────────────────────────────────┐
                          │         Web Browser / AI Tool    │
                          └──────────┬──────────┬───────────┘
                                     │          │
                              HTTPS  │          │  MCP / SDK
                                     │          │
                    ┌────────────────▼──┐   ┌──▼──────────────┐
                    │   Next.js Web App  │   │   MCP Server    │
                    │  (Vercel)          │   │   / SDK Client  │
                    │                    │   │                 │
                    │  ┌──────────────┐  │   └────────┬────────┘
                    │  │  Dashboard   │  │            │
                    │  │  UI          │  │            │
                    │  └──────────────┘  │            │
                    │  ┌──────────────┐  │            │
                    │  │  API Routes  │◄─┼────────────┘
                    │  │  /api/v1/*   │  │
                    │  └──────┬───────┘  │
                    └─────────┼──────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     ┌────────▼────────┐ ┌───▼────┐ ┌────────▼────────┐
     │   Supabase       │ │ Redis  │ │   Supabase Auth  │
     │   PostgreSQL     │ │        │ │                  │
     │   + pgvector     │ │ BullMQ │ │  JWT / Sessions  │
     │   + (AGE)        │ │ Queues │ │  API Keys        │
     └─────────▲────────┘ └───┬────┘ └──────────────────┘
               │              │
               │    ┌─────────▼──────────┐
               │    │   Worker Service    │
               │    │   (Railway)         │
               │    │                     │
               │    │  ┌───────────────┐  │
               │    │  │  Connectors   │  │
               │    │  │  (Slack,      │  │
               │    │  │   Notion,     │  │
               │    │  │   Jira, ...)  │  │
               │    │  └───────┬───────┘  │
               │    │          │          │
               │    │  ┌───────▼───────┐  │
               │    │  │  Extraction   │  │
               │    │  │  Pipeline     │  │
               │    │  │  (LLM)       │  │
               │    │  └───────┬───────┘  │
               │    │          │          │
               │    │  ┌───────▼───────┐  │
               │    │  │  Knowledge    │  │
               └────┼──┤  Storage      │  │
                    │  └───────────────┘  │
                    └─────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     ┌────────▼───┐  ┌───────▼───┐  ┌────────▼───┐
     │  Slack API  │  │ Notion API│  │  Jira API  │  ...
     └────────────┘  └───────────┘  └────────────┘
```

---

## Components

### Web App (`apps/web`)

The Next.js 14 application serves two purposes:

1. **Dashboard UI** -- A React-based interface where users manage connectors, browse extracted knowledge, ask questions, view alerts, and configure their organization.
2. **API Routes** -- REST endpoints under `/api/v1/` that power the dashboard, the SDK, and the MCP server. Authentication is handled via Supabase session cookies (for the dashboard) or Bearer API keys (for programmatic access).

Key route groups:
- `(auth)` -- Login, signup, and OAuth callback pages.
- `(dashboard)` -- Protected pages: overview, ask, knowledge (facts / processes / decisions / norms), connectors, crawler, API keys, team, settings.
- `(marketing)` -- Public pages such as pricing.

### Worker Service (`apps/worker`)

A long-running Node.js process that consumes jobs from BullMQ queues. Responsibilities:

- **Connector sync** -- Periodically polls third-party APIs (Slack, Notion, Jira, GitHub, etc.) for new events using stored sync cursors.
- **Webhook ingestion** -- Processes incoming webhook payloads pushed by connectors.
- **Extraction pipeline** -- Passes batches of raw events through the LLM extraction pipeline to produce knowledge units and entities.
- **Post-processing** -- Deduplication, contradiction detection, confidence scoring, and entity resolution.

The worker runs independently from the web app and communicates only through the database and Redis queues.

### Shared Package (`packages/shared`)

Contains code shared between the web app, worker, SDK, and MCP server:

- **Types** -- TypeScript interfaces for all domain objects (knowledge units, connectors, entities, queries, alerts, billing, auth).
- **Constants** -- Connector metadata, plan definitions, rate limits, system limits.
- **Validators** -- Zod schemas for request validation.
- **Utilities** -- Shared helper functions.

### MCP Server (`packages/mcp-server`)

An MCP (Model Context Protocol) server that exposes TribeMem knowledge to AI tools such as Claude Desktop, Claude Code, and Cursor. Runs as a local process and communicates with the TribeMem API using an API key.

### SDK (`packages/sdk`)

A TypeScript client library (`@tribemem/sdk`) that wraps the REST API with a typed, ergonomic interface. Used by the MCP server and available for third-party integrations.

---

## Data Flow

```
Third-Party API
      │
      │  1. Connector polls or receives webhook
      ▼
┌─────────────┐
│  Raw Event   │   Stored in raw_events table with full payload
└──────┬──────┘
       │
       │  2. Batched by connector + time window
       ▼
┌─────────────┐
│  Event Batch │   Grouped for efficient LLM processing
└──────┬──────┘
       │
       │  3. LLM extraction (Claude Haiku)
       ▼
┌─────────────┐
│  Extracted   │   Facts, processes, decisions, norms, entities
│  Knowledge   │
└──────┬──────┘
       │
       │  4. Deduplication + entity resolution
       ▼
┌─────────────┐
│  Deduplicated│   Matched against existing knowledge units
│  Units       │
└──────┬──────┘
       │
       │  5. Contradiction check
       ▼
┌─────────────┐
│  Validated   │   Contradictions flagged, alerts created
│  Knowledge   │
└──────┬──────┘
       │
       │  6. Stored with embeddings
       ▼
┌─────────────┐
│  Knowledge   │   Persisted in knowledge_units table
│  Units       │   with pgvector embeddings
└──────┬──────┘
       │
       │  7. User queries (dashboard, API, MCP)
       ▼
┌─────────────┐
│  Query       │   Semantic search + LLM synthesis (Claude Sonnet)
│  Engine      │
└──────┬──────┘
       │
       ▼
   Answer with sources, confidence, and related questions
```

---

## Database Architecture

TribeMem uses **Supabase** (hosted PostgreSQL) with the following extensions:

- **pgvector** -- Stores and queries vector embeddings for semantic search over knowledge units.
- **Apache AGE** (optional) -- Enables graph queries over entity relationships for complex relationship traversal.

### Core Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant organization records |
| `members` | Organization membership and roles |
| `api_keys` | Hashed API keys with scopes |
| `connectors` | Configured connector instances |
| `sync_cursors` | Pagination state for each connector |
| `raw_events` | Ingested events from third-party APIs |
| `knowledge_units` | Extracted knowledge with embeddings |
| `knowledge_versions` | Full version history per knowledge unit |
| `entities` | Extracted entities (people, teams, systems, etc.) |
| `entity_relations` | Relationships between entities |
| `crawler_runs` | Crawler execution history and metrics |
| `alerts` | System and knowledge alerts |
| `alert_rules` | User-configured alert rules |
| `subscriptions` | Stripe subscription state |
| `billing_events` | Billing event log |
| `usage_periods` | Per-period usage counters |
| `query_logs` | Query history with feedback |

### Row-Level Security

All tables use Supabase RLS policies scoped to `org_id`. Every query is filtered by the authenticated user's organization, ensuring strict tenant isolation.

---

## Queue Architecture

TribeMem uses **BullMQ** backed by **Redis** for asynchronous job processing.

### Queues

| Queue | Purpose | Concurrency |
|-------|---------|-------------|
| `connector-sync` | Scheduled polling of third-party APIs | 5 |
| `webhook-ingest` | Processing incoming webhook payloads | 10 |
| `extraction` | LLM extraction of knowledge from raw events | 3 |
| `post-process` | Deduplication, contradiction checks, entity resolution | 5 |
| `alerts` | Alert evaluation and notification delivery | 5 |

### Job Lifecycle

1. A scheduled repeating job (or webhook handler) enqueues a `connector-sync` job.
2. The connector fetches new events and stores them as `raw_events`.
3. An `extraction` job is enqueued for the new batch.
4. The extraction processor calls the LLM and produces candidate knowledge units.
5. A `post-process` job deduplicates, checks for contradictions, and persists the results.
6. If contradictions or anomalies are found, an `alerts` job is enqueued.

---

## Authentication Flow

### Dashboard (Browser)

1. User signs up or logs in via Supabase Auth (email/password or OAuth).
2. Supabase issues a JWT stored as an HTTP-only cookie.
3. The Next.js middleware validates the session on every request.
4. API routes extract the user's `org_id` from the session to scope all queries.

### Programmatic Access (API / SDK / MCP)

1. A user creates an API key in the dashboard, selecting scopes (e.g., `query:read`, `knowledge:read`).
2. The full key is shown once; a SHA-256 hash is stored in the `api_keys` table.
3. Clients pass the key as a `Bearer` token in the `Authorization` header.
4. The API route hashes the incoming key, looks up the matching record, and verifies scopes.

---

## Multi-Tenancy Model

TribeMem is fully multi-tenant with organization-scoped data:

- Every database row carries an `org_id` foreign key.
- PostgreSQL RLS policies enforce that users can only access rows belonging to their organization.
- API keys are scoped to a single organization.
- Plan-based quotas (connectors, members, queries, knowledge units) are enforced at the API layer using the organization's active subscription.
- Rate limits are applied per organization and vary by plan tier.
