# TribeMem — Full Platform Specification

> **Purpose of this document**: This is the single source of truth for building TribeMem. It is written so that Claude Code (or any autonomous coding agent) can read this file and build the entire platform end-to-end without additional human guidance. Every architectural decision, database schema, API endpoint, component, and business rule is defined here.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack](#2-tech-stack)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Connector System (Crawlers)](#6-connector-system-crawlers)
7. [Extraction Engine](#7-extraction-engine)
8. [Memory Lake (Knowledge Graph)](#8-memory-lake-knowledge-graph)
9. [Query Engine](#9-query-engine)
10. [API Specification](#10-api-specification)
11. [MCP Server](#11-mcp-server)
12. [Frontend Application](#12-frontend-application)
13. [Background Jobs & Scheduling](#13-background-jobs--scheduling)
14. [Billing & Subscriptions](#14-billing--subscriptions)
15. [Security & Privacy](#15-security--privacy)
16. [Deployment & Infrastructure](#16-deployment--infrastructure)
17. [Environment Variables](#17-environment-variables)
18. [Build Plan (Step-by-Step)](#18-build-plan-step-by-step)

---

## 1. Product Overview

### What TribeMem Is
An autonomous crawler agent platform that plugs into all your business systems (Slack, Intercom, Jira, GitHub, Notion, Stripe, etc.), continuously extracts institutional knowledge, and builds a living memory lake that any team member or AI agent can query to get real answers about how the company actually operates.

### Core Value Proposition
- **Not a wiki** — automatically stays current, no manual curation needed
- **Not document search** — synthesizes knowledge from behavior, communication, and patterns across systems
- **Not personal memory** — captures organizational/team knowledge, not individual user preferences
- **Temporal versioning** — every fact has a timeline; old versions are superseded, never deleted
- **Source-linked** — every answer traces back to the original messages, tickets, docs that generated it

### Key User Personas
1. **Team Lead / Manager** — wants to onboard new hires faster, reduce repeated questions
2. **New Employee** — wants to understand how things really work without bugging everyone
3. **Consultant / Auditor** — needs to understand decisions and their rationale
4. **Developer** — wants to query organizational context via API/MCP for their own tools
5. **Ops / Support Lead** — wants to identify process drift and knowledge gaps

### Core User Flows
1. **Connect systems** → OAuth flow to connect Slack, Notion, Jira, etc.
2. **Crawler activates** → background agent starts extracting knowledge
3. **Memory lake builds** → facts, processes, decisions, norms appear in dashboard
4. **Team queries** → chat interface or API returns synthesized answers
5. **Knowledge evolves** → crawler continuously updates, contradictions flagged

---

## 2. Tech Stack

### Core
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Language | TypeScript (strict mode) | Full-stack consistency, type safety |
| Runtime | Node.js 20+ | LTS, native fetch, worker threads |
| Framework | Next.js 14 (App Router) | SSR, API routes, middleware, proven |
| UI Components | shadcn/ui + Tailwind CSS 3.4 | Accessible, customizable, consistent |
| Database | Supabase (PostgreSQL 15+) | Postgres + pgvector + Auth + Realtime |
| Vector Store | pgvector (via Supabase) | Co-located with relational data |
| Graph Layer | Apache AGE (Postgres extension) | Graph queries without separate DB |
| Queue System | BullMQ + Redis | Reliable job scheduling, retries |
| LLM Provider | Anthropic API | Haiku for extraction, Sonnet for synthesis |
| Email | Resend | Transactional emails, alerts |
| Payments | Stripe | Subscriptions, metered billing |
| Hosting | Vercel (frontend) + Railway (workers) | Serverless frontend, persistent workers |
| Monorepo | Turborepo | Build caching, task orchestration |
| Package Manager | pnpm | Fast, disk-efficient |

### Key Libraries
```
# Frontend
next@14, react@18, tailwindcss, @shadcn/ui, lucide-react, zustand (state),
swr (data fetching), react-markdown, react-syntax-highlighter,
@tanstack/react-table, recharts, date-fns, zod

# Backend
@anthropic-ai/sdk, bullmq, ioredis, @supabase/supabase-js,
@supabase/auth-helpers-nextjs, stripe, resend, zod,
uuid, slugify, p-limit (concurrency), tiktoken (token counting)

# Connector SDKs
@slack/web-api, @slack/events-api, @notionhq/client,
@octokit/rest, @linear/sdk, googleapis, stripe

# Dev
typescript, eslint, prettier, vitest, playwright
```

---

## 3. Monorepo Structure

```
tribemem/
├── apps/
│   ├── web/                          # Next.js 14 frontend + API routes
│   │   ├── app/
│   │   │   ├── (marketing)/          # Landing page, pricing, docs
│   │   │   │   ├── page.tsx          # Homepage
│   │   │   │   ├── pricing/
│   │   │   │   └── docs/
│   │   │   ├── (auth)/               # Auth pages
│   │   │   │   ├── login/
│   │   │   │   ├── signup/
│   │   │   │   └── callback/
│   │   │   ├── (dashboard)/          # Authenticated app
│   │   │   │   ├── layout.tsx        # Dashboard shell with sidebar
│   │   │   │   ├── overview/         # Knowledge dashboard
│   │   │   │   ├── ask/              # Chat / query interface
│   │   │   │   ├── knowledge/        # Browse knowledge graph
│   │   │   │   │   ├── facts/
│   │   │   │   │   ├── processes/
│   │   │   │   │   ├── decisions/
│   │   │   │   │   └── norms/
│   │   │   │   ├── connectors/       # Manage integrations
│   │   │   │   ├── crawler/          # Crawler status & logs
│   │   │   │   ├── team/             # Team members & roles
│   │   │   │   ├── settings/         # Org settings, billing
│   │   │   │   └── api-keys/         # API key management
│   │   │   └── api/
│   │   │       ├── v1/               # Public API
│   │   │       │   ├── query/
│   │   │       │   ├── knowledge/
│   │   │       │   ├── connectors/
│   │   │       │   └── webhooks/
│   │   │       ├── internal/         # Internal endpoints
│   │   │       │   ├── crawler/
│   │   │       │   └── extraction/
│   │   │       ├── auth/
│   │   │       ├── billing/
│   │   │       └── webhooks/         # Incoming webhooks from connectors
│   │   │           ├── slack/
│   │   │           ├── github/
│   │   │           └── stripe/
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── layout/              # Shell, sidebar, header
│   │   │   ├── knowledge/           # Knowledge display components
│   │   │   ├── chat/                # Chat/query interface
│   │   │   ├── connectors/          # Connector cards, setup flows
│   │   │   ├── crawler/             # Status, logs, controls
│   │   │   └── billing/             # Plans, usage, invoices
│   │   ├── lib/
│   │   │   ├── supabase/            # Supabase client, helpers
│   │   │   ├── stripe/              # Stripe helpers
│   │   │   ├── api/                 # API client helpers
│   │   │   └── utils/               # Shared utilities
│   │   └── hooks/                   # React hooks
│   │
│   └── worker/                       # Background worker service
│       ├── src/
│       │   ├── index.ts             # Worker entry point
│       │   ├── queues/              # BullMQ queue definitions
│       │   │   ├── crawl.queue.ts
│       │   │   ├── extract.queue.ts
│       │   │   └── sync.queue.ts
│       │   ├── processors/          # Job processors
│       │   │   ├── crawl.processor.ts
│       │   │   ├── extract.processor.ts
│       │   │   ├── synthesize.processor.ts
│       │   │   └── alert.processor.ts
│       │   ├── connectors/          # Connector implementations
│       │   │   ├── base.connector.ts
│       │   │   ├── slack.connector.ts
│       │   │   ├── notion.connector.ts
│       │   │   ├── jira.connector.ts
│       │   │   ├── github.connector.ts
│       │   │   ├── intercom.connector.ts
│       │   │   ├── linear.connector.ts
│       │   │   ├── google-drive.connector.ts
│       │   │   ├── hubspot.connector.ts
│       │   │   └── stripe.connector.ts
│       │   ├── extraction/          # LLM extraction pipeline
│       │   │   ├── extractor.ts
│       │   │   ├── deduplicator.ts
│       │   │   ├── entity-resolver.ts
│       │   │   ├── contradiction-detector.ts
│       │   │   └── prompts/
│       │   │       ├── extract-facts.ts
│       │   │       ├── extract-processes.ts
│       │   │       ├── extract-decisions.ts
│       │   │       ├── resolve-entities.ts
│       │   │       └── detect-contradictions.ts
│       │   ├── memory/              # Memory lake operations
│       │   │   ├── graph.ts         # Knowledge graph operations
│       │   │   ├── vector.ts        # Vector store operations
│       │   │   ├── temporal.ts      # Temporal versioning logic
│       │   │   └── linker.ts        # Source linking
│       │   └── lib/
│       │       ├── anthropic.ts     # Anthropic client wrapper
│       │       ├── supabase.ts      # Supabase client
│       │       ├── redis.ts         # Redis connection
│       │       └── tokens.ts        # Token counting utilities
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── shared/                      # Shared types, constants, utils
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── knowledge.ts     # Knowledge unit types
│   │   │   │   ├── connector.ts     # Connector types
│   │   │   │   ├── crawler.ts       # Crawler types
│   │   │   │   ├── query.ts         # Query/response types
│   │   │   │   ├── billing.ts       # Billing types
│   │   │   │   └── index.ts
│   │   │   ├── constants/
│   │   │   │   ├── plans.ts         # Subscription plan definitions
│   │   │   │   ├── connectors.ts    # Connector metadata
│   │   │   │   └── limits.ts        # Rate limits, quotas
│   │   │   ├── validators/          # Zod schemas
│   │   │   │   ├── knowledge.ts
│   │   │   │   ├── query.ts
│   │   │   │   └── connector.ts
│   │   │   └── utils/
│   │   │       ├── slug.ts
│   │   │       ├── date.ts
│   │   │       └── crypto.ts
│   │   └── package.json
│   │
│   ├── mcp-server/                  # MCP server package
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── tools/
│   │   │   │   ├── query-knowledge.ts
│   │   │   │   ├── get-process.ts
│   │   │   │   ├── list-decisions.ts
│   │   │   │   └── get-context.ts
│   │   │   └── auth.ts
│   │   └── package.json
│   │
│   └── sdk/                         # TypeScript SDK for API consumers
│       ├── src/
│       │   ├── index.ts
│       │   ├── client.ts
│       │   ├── knowledge.ts
│       │   ├── query.ts
│       │   └── connectors.ts
│       └── package.json
│
├── supabase/
│   ├── migrations/                  # Ordered SQL migrations
│   │   ├── 00001_create_organizations.sql
│   │   ├── 00002_create_members.sql
│   │   ├── 00003_create_connectors.sql
│   │   ├── 00004_create_raw_events.sql
│   │   ├── 00005_create_knowledge_units.sql
│   │   ├── 00006_create_knowledge_versions.sql
│   │   ├── 00007_create_entities.sql
│   │   ├── 00008_create_entity_relations.sql
│   │   ├── 00009_create_sources.sql
│   │   ├── 00010_create_queries.sql
│   │   ├── 00011_create_api_keys.sql
│   │   ├── 00012_create_crawler_runs.sql
│   │   ├── 00013_create_alerts.sql
│   │   ├── 00014_create_billing.sql
│   │   ├── 00015_enable_pgvector.sql
│   │   ├── 00016_enable_age.sql
│   │   └── 00017_create_rls_policies.sql
│   └── seed.sql                     # Demo/dev seed data
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── tribemem-spec.md               # This file
```

---

## 4. Database Schema

### 4.1 Organizations

```sql
-- 00001_create_organizations.sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('free', 'starter', 'growth', 'business', 'enterprise')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  settings JSONB NOT NULL DEFAULT '{
    "crawl_schedule": "realtime",
    "extraction_model": "haiku",
    "synthesis_model": "sonnet",
    "auto_alerts": true,
    "retention_months": 6,
    "allowed_channels": [],
    "excluded_channels": [],
    "excluded_patterns": []
  }'::jsonb,
  usage_this_period JSONB NOT NULL DEFAULT '{
    "crawl_events": 0,
    "extractions": 0,
    "queries": 0,
    "api_calls": 0,
    "tokens_used": 0
  }'::jsonb,
  usage_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_stripe ON organizations(stripe_customer_id);
```

### 4.2 Members

```sql
-- 00002_create_members.sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_members_org ON members(org_id);
CREATE INDEX idx_members_user ON members(user_id);
```

### 4.3 Connectors

```sql
-- 00003_create_connectors.sql
CREATE TABLE connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'slack', 'teams', 'notion', 'confluence', 'jira', 'linear',
    'github', 'gitlab', 'intercom', 'zendesk', 'freshdesk',
    'google_drive', 'hubspot', 'stripe'
  )),
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'connected', 'syncing', 'active', 'error', 'paused', 'revoked'
  )),
  -- OAuth credentials (encrypted at rest via Supabase Vault)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  -- Connector-specific config
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example Slack config:
  -- {
  --   "team_id": "T123",
  --   "team_name": "Acme Corp",
  --   "channels": ["C123", "C456"],
  --   "excluded_channels": ["C789"],
  --   "bot_user_id": "U_BOT"
  -- }
  -- Sync state
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_error TEXT,
  sync_cursor JSONB DEFAULT '{}'::jsonb,
  -- Stats
  total_events_ingested BIGINT NOT NULL DEFAULT 0,
  total_knowledge_extracted BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(org_id, type)
);

CREATE INDEX idx_connectors_org ON connectors(org_id);
CREATE INDEX idx_connectors_status ON connectors(status);
```

### 4.4 Raw Events

```sql
-- 00004_create_raw_events.sql
-- Raw ingested data from connectors before extraction
CREATE TABLE raw_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connector_id UUID NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
  -- Event identity
  external_id TEXT NOT NULL,          -- ID in the source system
  event_type TEXT NOT NULL,           -- 'message', 'ticket', 'commit', 'page', 'comment', etc.
  source_channel TEXT,                -- Slack channel, Jira project, GitHub repo, etc.
  -- Content
  content TEXT NOT NULL,              -- Raw text content
  content_metadata JSONB DEFAULT '{}', -- Author, timestamps, reactions, thread info, etc.
  -- Processing state
  extraction_status TEXT NOT NULL DEFAULT 'pending' CHECK (extraction_status IN (
    'pending', 'processing', 'extracted', 'skipped', 'error'
  )),
  extraction_error TEXT,
  extracted_at TIMESTAMPTZ,
  -- Timestamps
  event_timestamp TIMESTAMPTZ NOT NULL, -- When this happened in the source system
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(connector_id, external_id)
);

CREATE INDEX idx_raw_events_org ON raw_events(org_id);
CREATE INDEX idx_raw_events_connector ON raw_events(connector_id);
CREATE INDEX idx_raw_events_status ON raw_events(extraction_status);
CREATE INDEX idx_raw_events_timestamp ON raw_events(event_timestamp DESC);

-- Partition by month for performance (events table grows fast)
-- Implementation note: consider partitioning in production
```

### 4.5 Knowledge Units

```sql
-- 00005_create_knowledge_units.sql
-- Atomic pieces of organizational knowledge
CREATE TABLE knowledge_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Classification
  type TEXT NOT NULL CHECK (type IN ('fact', 'process', 'decision', 'norm', 'definition')),
  category TEXT,                       -- e.g., 'engineering', 'support', 'hr', 'finance', 'product'
  -- Content
  title TEXT NOT NULL,                 -- Short summary: "Enterprise SLA is 4-hour response"
  content TEXT NOT NULL,               -- Full description with context
  content_embedding VECTOR(1536),     -- text-embedding-3-small
  -- Confidence & relevance
  confidence_score FLOAT NOT NULL DEFAULT 0.5 CHECK (confidence_score BETWEEN 0 AND 1),
  evidence_count INT NOT NULL DEFAULT 1,  -- How many sources support this
  last_confirmed_at TIMESTAMPTZ,          -- When was this last seen in the data
  -- Temporal versioning
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  superseded_by UUID REFERENCES knowledge_units(id),
  supersedes UUID REFERENCES knowledge_units(id),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,            -- NULL = still current
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'superseded', 'contradicted', 'archived', 'flagged'
  )),
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_org ON knowledge_units(org_id);
CREATE INDEX idx_knowledge_type ON knowledge_units(type);
CREATE INDEX idx_knowledge_category ON knowledge_units(category);
CREATE INDEX idx_knowledge_status ON knowledge_units(status);
CREATE INDEX idx_knowledge_current ON knowledge_units(org_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_knowledge_embedding ON knowledge_units USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_tags ON knowledge_units USING gin (tags);
```

### 4.6 Knowledge Versions (Audit Trail)

```sql
-- 00006_create_knowledge_versions.sql
CREATE TABLE knowledge_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_unit_id UUID NOT NULL REFERENCES knowledge_units(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN (
    'created', 'updated', 'superseded', 'contradicted', 'confirmed', 'archived'
  )),
  previous_content TEXT,
  new_content TEXT,
  change_reason TEXT,                  -- Why was this changed
  changed_by TEXT NOT NULL DEFAULT 'crawler', -- 'crawler', 'manual', 'contradiction_resolver'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(knowledge_unit_id, version_number)
);

CREATE INDEX idx_kv_unit ON knowledge_versions(knowledge_unit_id);
```

### 4.7 Entities

```sql
-- 00007_create_entities.sql
-- People, systems, teams, concepts mentioned in knowledge
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'person', 'team', 'system', 'tool', 'process', 'client',
    'project', 'concept', 'channel', 'repository', 'other'
  )),
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',        -- Alternative names/handles
  description TEXT,
  metadata JSONB DEFAULT '{}',
  mention_count INT NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(org_id, type, name)
);

CREATE INDEX idx_entities_org ON entities(org_id);
CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_name ON entities(org_id, name);
```

### 4.8 Entity Relations

```sql
-- 00008_create_entity_relations.sql
CREATE TABLE entity_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,        -- 'manages', 'uses', 'owns', 'depends_on', 'part_of', 'works_on'
  strength FLOAT NOT NULL DEFAULT 0.5,
  evidence_count INT NOT NULL DEFAULT 1,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(source_entity_id, target_entity_id, relation_type)
);

CREATE INDEX idx_relations_source ON entity_relations(source_entity_id);
CREATE INDEX idx_relations_target ON entity_relations(target_entity_id);
```

### 4.9 Sources (Evidence Links)

```sql
-- 00009_create_sources.sql
-- Links knowledge units back to the raw events that generated them
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_unit_id UUID NOT NULL REFERENCES knowledge_units(id) ON DELETE CASCADE,
  raw_event_id UUID REFERENCES raw_events(id) ON DELETE SET NULL,
  connector_type TEXT NOT NULL,
  source_url TEXT,                    -- Deep link back to Slack message, Jira ticket, etc.
  source_title TEXT,                  -- "Message in #engineering by @john"
  source_snippet TEXT,                -- Relevant excerpt from the source
  source_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sources_knowledge ON sources(knowledge_unit_id);
CREATE INDEX idx_sources_event ON sources(raw_event_id);
```

### 4.10 Queries (Query Log)

```sql
-- 00010_create_queries.sql
CREATE TABLE queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  -- Query
  query_text TEXT NOT NULL,
  query_type TEXT NOT NULL DEFAULT 'chat' CHECK (query_type IN ('chat', 'api', 'mcp')),
  -- Response
  response_text TEXT,
  knowledge_units_used UUID[] DEFAULT '{}',
  confidence_score FLOAT,
  -- Feedback
  feedback_rating INT CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  -- Performance
  retrieval_time_ms INT,
  synthesis_time_ms INT,
  total_tokens_used INT,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_queries_org ON queries(org_id);
CREATE INDEX idx_queries_user ON queries(user_id);
CREATE INDEX idx_queries_created ON queries(created_at DESC);
```

### 4.11 API Keys

```sql
-- 00011_create_api_keys.sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  -- Key is stored as hash; prefix shown for identification
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,           -- "tm_live_abc1" (first 12 chars)
  -- Permissions
  scopes TEXT[] NOT NULL DEFAULT '{read}', -- 'read', 'write', 'admin'
  -- Limits
  rate_limit_per_minute INT NOT NULL DEFAULT 60,
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_org ON api_keys(org_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
```

### 4.12 Crawler Runs

```sql
-- 00012_create_crawler_runs.sql
CREATE TABLE crawler_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connector_id UUID NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
  -- Run info
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN (
    'running', 'completed', 'failed', 'cancelled'
  )),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  -- Stats
  events_fetched INT NOT NULL DEFAULT 0,
  events_new INT NOT NULL DEFAULT 0,
  events_skipped INT NOT NULL DEFAULT 0,
  knowledge_extracted INT NOT NULL DEFAULT 0,
  knowledge_updated INT NOT NULL DEFAULT 0,
  contradictions_found INT NOT NULL DEFAULT 0,
  tokens_used INT NOT NULL DEFAULT 0,
  -- Errors
  error_message TEXT,
  error_details JSONB
);

CREATE INDEX idx_crawler_runs_org ON crawler_runs(org_id);
CREATE INDEX idx_crawler_runs_connector ON crawler_runs(connector_id);
CREATE INDEX idx_crawler_runs_status ON crawler_runs(status);
```

### 4.13 Alerts

```sql
-- 00013_create_alerts.sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'contradiction', 'process_drift', 'knowledge_gap', 'stale_knowledge',
    'connector_error', 'usage_limit'
  )),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  related_knowledge_ids UUID[] DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_org ON alerts(org_id);
CREATE INDEX idx_alerts_unread ON alerts(org_id, is_read) WHERE is_read = FALSE;
```

### 4.14 Billing

```sql
-- 00014_create_billing.sql
CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,           -- 'subscription_created', 'invoice_paid', 'plan_changed', etc.
  stripe_event_id TEXT UNIQUE,
  amount_cents INT,
  currency TEXT DEFAULT 'eur',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_billing_org ON billing_events(org_id);
```

### 4.15 Extensions

```sql
-- 00015_enable_pgvector.sql
CREATE EXTENSION IF NOT EXISTS vector;

-- 00016_enable_age.sql
-- Apache AGE for graph queries
-- Note: if AGE is not available in Supabase, use recursive CTEs
-- on entity_relations table as fallback. AGE is preferred but optional.
CREATE EXTENSION IF NOT EXISTS age;
SET search_path = ag_catalog, public;
SELECT create_graph('knowledge_graph');
```

### 4.16 Row Level Security

```sql
-- 00017_create_rls_policies.sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Pattern: users can only access data for organizations they belong to
-- Example policy (apply similar pattern to all tables):
CREATE POLICY "members_org_access" ON organizations
  FOR ALL USING (
    id IN (SELECT org_id FROM members WHERE user_id = auth.uid())
  );

CREATE POLICY "members_self_access" ON members
  FOR ALL USING (
    org_id IN (SELECT org_id FROM members WHERE user_id = auth.uid())
  );

-- Repeat this pattern for every table with org_id column.
-- Key principle: every query is scoped to the user's organization(s).
```

---

## 5. Authentication & Authorization

### Auth Provider
Use Supabase Auth with the following providers:
- Email/password (primary)
- Google OAuth (convenience)
- GitHub OAuth (developer-friendly)

### Auth Flow
1. User signs up → creates `auth.users` record
2. User creates organization → `organizations` + `members` (role: owner)
3. User invites team → email invite link → new `members` record (role: member)
4. Session management via Supabase Auth helpers for Next.js

### Role Permissions Matrix

| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| Query knowledge | ✅ | ✅ | ✅ | ✅ |
| Browse knowledge graph | ✅ | ✅ | ✅ | ✅ |
| Manage connectors | ✅ | ✅ | ❌ | ❌ |
| Manage team members | ✅ | ✅ | ❌ | ❌ |
| Manage API keys | ✅ | ✅ | ✅ | ❌ |
| Edit organization settings | ✅ | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ |
| Pause/resume crawler | ✅ | ✅ | ❌ | ❌ |
| Resolve alerts | ✅ | ✅ | ✅ | ❌ |
| Provide query feedback | ✅ | ✅ | ✅ | ✅ |

### API Key Auth
For API/SDK/MCP access:
- Keys are prefixed: `tm_live_` (production) or `tm_test_` (sandbox)
- Stored as SHA-256 hash in database
- Passed via `Authorization: Bearer tm_live_xxx` header
- Rate limited per key (configurable per plan)

---

## 6. Connector System (Crawlers)

### 6.1 Base Connector Interface

Every connector implements this interface:

```typescript
interface BaseConnector {
  type: ConnectorType;
  
  // OAuth
  getAuthUrl(orgId: string, redirectUrl: string): string;
  handleCallback(code: string, orgId: string): Promise<ConnectorCredentials>;
  refreshToken(connector: Connector): Promise<ConnectorCredentials>;
  
  // Data fetching
  fetchEvents(connector: Connector, cursor: SyncCursor): Promise<{
    events: RawEvent[];
    nextCursor: SyncCursor;
    hasMore: boolean;
  }>;
  
  // Webhook handling (optional, for real-time)
  handleWebhook?(payload: unknown): Promise<RawEvent[]>;
  
  // Health check
  testConnection(connector: Connector): Promise<boolean>;
  
  // Deep link generation
  getSourceUrl(event: RawEvent): string | null;
}
```

### 6.2 Connector Implementations

#### Slack Connector
- **Auth**: OAuth 2.0 with bot scopes: `channels:history`, `channels:read`, `groups:history`, `groups:read`, `users:read`, `reactions:read`, `files:read`
- **Real-time**: Slack Events API webhook for new messages
- **Backfill**: Paginated `conversations.history` for initial sync
- **Events extracted**: messages (excluding bot messages), thread replies, reactions (as signal), file shares (titles/descriptions only, not file content)
- **Channel scoping**: Admin configures which channels to monitor; default is all public channels. Private channels require explicit opt-in.
- **Rate limits**: Tier 3 (50 req/min). Use `p-limit` with concurrency of 5 and 1.2s delay between pages.
- **Cursor strategy**: Store `oldest` timestamp per channel in `sync_cursor` JSONB.
- **Content format**: `"[#{channel}] @{user}: {message_text}"` with thread context if reply.

#### Notion Connector
- **Auth**: OAuth 2.0 (Notion integration)
- **Scopes**: `read_content`, `read_user`
- **Sync method**: `search` API with `last_edited_time` filter for incremental updates
- **Events extracted**: page content (blocks to markdown), database entries, comments
- **Rate limits**: 3 requests/second. Queue with 350ms delay.
- **Cursor**: `last_edited_time` of most recently processed page.
- **Content format**: Flatten block tree to markdown. Preserve headings, lists, code blocks. Skip images/embeds but note their existence.

#### Jira Connector
- **Auth**: OAuth 2.0 (Atlassian)
- **Sync method**: JQL search with `updatedDate` filter
- **Events extracted**: issue descriptions, comments, status changes, resolution summaries
- **Rate limits**: Respect `X-RateLimit-*` headers. Default 10 req/sec.
- **Cursor**: `updatedDate` of last processed issue.
- **Content format**: `"[{project}-{key}] {summary}\nStatus: {status}\nAssignee: {assignee}\n\n{description}\n\nComments:\n{comments_joined}"` 

#### GitHub Connector
- **Auth**: GitHub App installation
- **Sync method**: Events API + REST for backfill
- **Events extracted**: PR descriptions, PR review comments, issue descriptions, issue comments, commit messages (only merge commits to reduce noise), README/CONTRIBUTING changes
- **Webhook**: `pull_request`, `issues`, `issue_comment`, `pull_request_review`
- **Rate limits**: 5000 req/hour (authenticated). Use conditional requests with ETags.
- **Cursor**: `since` parameter for list endpoints.

#### Intercom Connector
- **Auth**: OAuth 2.0
- **Sync method**: Search API with date filters
- **Events extracted**: conversation transcripts (both sides), internal notes, resolution tags
- **Rate limits**: 1000 req/min.
- **Cursor**: `updated_at` of last processed conversation.

#### Linear Connector
- **Auth**: OAuth 2.0
- **Sync method**: GraphQL API with `updatedAt` filter
- **Events extracted**: issue descriptions, comments, status changes, project updates
- **Cursor**: `updatedAt` timestamp.

#### Google Drive Connector
- **Auth**: OAuth 2.0 (Google)
- **Scopes**: `drive.readonly`
- **Sync method**: Changes API with `startPageToken`
- **Events extracted**: Google Docs content (exported to text), Sheets metadata, Slides text
- **Cursor**: `startPageToken` from Changes API.

#### HubSpot Connector
- **Auth**: OAuth 2.0
- **Sync method**: CRM Search API with `lastmodifieddate` filter
- **Events extracted**: deal notes, contact notes, activity logs, email logs (subject + snippet, not full body)
- **Cursor**: `lastmodifieddate` of last processed record.

#### Stripe Connector
- **Auth**: OAuth 2.0 (Stripe Connect) or restricted API key
- **Sync method**: List endpoints with `created` filter
- **Events extracted**: subscription changes, refund reasons, dispute details, customer metadata updates
- **Note**: Financial data is sensitive. Extraction prompts must NEVER extract dollar amounts, card details, or PII. Only extract process-level knowledge (e.g., "refunds are typically processed within 48 hours based on 150 refund events").

### 6.3 Connector Management Rules
- Each organization can connect one instance per connector type
- OAuth tokens are encrypted at rest using Supabase Vault
- Token refresh happens automatically before expiry (check on each crawl run)
- If refresh fails 3 times, connector status → 'error', alert created
- Connectors can be paused/resumed by admin
- Disconnecting a connector does NOT delete extracted knowledge (it's still valuable). Only raw_events are marked as orphaned.

---

## 7. Extraction Engine

### 7.1 Pipeline Overview

```
Raw Event → Batch Aggregation → LLM Extraction → Entity Resolution → 
Deduplication → Contradiction Detection → Knowledge Unit Creation → 
Vector Embedding → Source Linking
```

### 7.2 Batch Aggregation

Don't extract from individual messages — batch by context:
- **Slack**: Group messages by thread (if threaded) or by time window (15-minute blocks for channel flow)
- **Jira**: Group issue + all comments as one unit
- **GitHub**: Group PR + reviews + comments as one unit
- **Notion**: Each page is one unit
- **Intercom**: Each conversation is one unit

This gives the LLM enough context to extract meaningful knowledge rather than fragmentary facts.

### 7.3 Extraction Prompts

#### Fact Extraction Prompt

```typescript
const EXTRACT_FACTS_PROMPT = `You are an organizational knowledge extractor. Given a batch of messages/content from a company's internal systems, extract atomic facts about how this organization operates.

RULES:
1. Extract ONLY organizational knowledge — not personal opinions, jokes, or off-topic chat
2. Each fact must be self-contained and understandable without the original context
3. Include WHO, WHAT, WHEN, WHERE, WHY when available
4. Distinguish between stated policy and observed behavior
5. Note confidence: HIGH (explicitly stated by authority), MEDIUM (mentioned by multiple people), LOW (single mention or implied)
6. NEVER extract PII (personal addresses, phone numbers, salaries) or financial figures
7. NEVER extract credentials, API keys, passwords, or secrets
8. If content is clearly social/personal chat (lunch plans, weekend talk), return empty array

SOURCE SYSTEM: {connector_type}
SOURCE CHANNEL: {source_channel}
TIMESTAMP: {event_timestamp}

CONTENT:
{batched_content}

Respond with a JSON array of extracted facts:
[
  {
    "type": "fact" | "process" | "decision" | "norm" | "definition",
    "title": "Short one-line summary",
    "content": "Full description with context",
    "category": "engineering" | "support" | "hr" | "finance" | "product" | "operations" | "sales" | "general",
    "confidence": "high" | "medium" | "low",
    "entities": [{"name": "...", "type": "person|team|system|tool|project|client", "role": "..."}],
    "temporal_context": "current" | "historical" | "planned",
    "tags": ["..."]
  }
]

If no organizational knowledge can be extracted, return an empty array [].`;
```

#### Entity Resolution Prompt

```typescript
const RESOLVE_ENTITIES_PROMPT = `Given a list of entities extracted from organizational communications, identify which entries refer to the same real-world entity.

EXISTING KNOWN ENTITIES:
{existing_entities_json}

NEW ENTITIES TO RESOLVE:
{new_entities_json}

For each new entity, respond with:
[
  {
    "new_entity": "...",
    "matches_existing": "existing_entity_id" | null,
    "confidence": 0.0-1.0,
    "reason": "Why these match or don't match"
  }
]

Common patterns:
- "@john" and "John Smith" and "John from engineering" → same person
- "the API" and "our REST API" and "customer-api" → might be same, might not
- "Slack" (the tool) vs "#slack-channel" → different entities`;
```

#### Contradiction Detection Prompt

```typescript
const DETECT_CONTRADICTIONS_PROMPT = `Compare a newly extracted knowledge unit with existing knowledge units that appear related. Determine if there is a contradiction, update, or confirmation.

NEW KNOWLEDGE:
{new_knowledge_json}

POTENTIALLY RELATED EXISTING KNOWLEDGE:
{existing_knowledge_json}

For each existing knowledge unit, determine the relationship:
[
  {
    "existing_id": "...",
    "relationship": "confirms" | "updates" | "contradicts" | "unrelated",
    "explanation": "Why this relationship exists",
    "recommended_action": "keep_both" | "supersede_old" | "flag_for_review" | "merge",
    "merged_content": "..." // Only if recommended_action is "merge"
  }
]

GUIDELINES:
- "confirms": New info supports existing knowledge (increase confidence)
- "updates": New info is a more recent version of the same knowledge (supersede)
- "contradicts": New info directly conflicts with existing (flag for review)
- "unrelated": Despite surface similarity, these are about different things`;
```

### 7.4 Extraction Model Selection

| Task | Model | Rationale |
|------|-------|-----------|
| Fact extraction | claude-haiku-4-5-20251001 | High volume, cost-sensitive, structured output |
| Entity resolution | claude-haiku-4-5-20251001 | Pattern matching, not complex reasoning |
| Contradiction detection | claude-sonnet-4-6 | Requires nuanced comparison and judgment |
| Query synthesis | claude-sonnet-4-6 | User-facing, quality matters |

### 7.5 Token Budget Management

- Track tokens per extraction via `tiktoken` estimation before API calls
- Batch raw events to stay within 4K input tokens per extraction call (Haiku)
- If a single event exceeds 4K tokens (long doc), split into sections with overlap
- Monthly token budget per plan tier enforced at the queue level
- When budget is 80% consumed, alert the org admin
- When budget is 100% consumed, pause extraction (not crawling — events still get ingested)

### 7.6 Embedding Strategy

- Model: `text-embedding-3-small` (1536 dimensions) via OpenAI API
  - Alternative: use Anthropic embeddings if/when available, or Supabase built-in embeddings
- Embed the `title + content` of each knowledge unit
- Batch embedding calls: up to 100 texts per API call
- Store in `content_embedding` column (pgvector)
- Cosine similarity for retrieval with IVFFlat index (100 lists)

---

## 8. Memory Lake (Knowledge Graph)

### 8.1 Knowledge Unit Lifecycle

```
Created → Active → [Confirmed | Updated | Superseded | Contradicted | Archived]
```

- **Created**: First extraction. `confidence_score` based on extraction confidence.
- **Active**: Living knowledge. Confidence increases when confirmed by new evidence.
- **Confirmed**: Same fact seen again → `evidence_count++`, `confidence_score` increases (capped at 0.95), `last_confirmed_at` updated.
- **Updated**: Minor update to existing fact → new version created, old content preserved in `knowledge_versions`.
- **Superseded**: New fact replaces old → old unit gets `is_current = FALSE`, `superseded_by` points to new unit, `status = 'superseded'`.
- **Contradicted**: Conflicting info detected → alert created, both units flagged for human review.
- **Archived**: Manually archived or auto-archived after configurable staleness period.

### 8.2 Confidence Scoring

```
Initial confidence:
  - High confidence extraction + 1 source = 0.7
  - Medium confidence extraction + 1 source = 0.5
  - Low confidence extraction + 1 source = 0.3

Confirmation boost:
  - Each additional source: +0.1 (diminishing: +0.1, +0.08, +0.06, +0.04, ...)
  - Cap at 0.95

Decay:
  - If not confirmed for 90 days: confidence *= 0.9
  - If not confirmed for 180 days: confidence *= 0.8
  - Below 0.2: auto-flagged as stale → alert generated
```

### 8.3 Staleness Detection

A background job runs daily per organization:
1. Find all active knowledge units where `last_confirmed_at` < 90 days ago
2. Apply confidence decay
3. Generate `stale_knowledge` alert for units below 0.2 confidence
4. Generate `process_drift` alert when a process-type unit's behavior hasn't been seen in crawled data for 60+ days

### 8.4 Graph Operations

The entity-relation graph enables traversal queries like:
- "Who owns the deployment process?" → traverse `person -[owns]-> process`
- "What systems does the payments team manage?" → traverse `team -[manages]-> system`
- "What changed about our onboarding since January?" → temporal query on knowledge units with category 'hr' + type 'process'

If Apache AGE is available, use Cypher queries. Otherwise, implement graph traversal using recursive CTEs on the `entity_relations` table. Both approaches work — AGE is syntactically nicer but not a hard requirement.

---

## 9. Query Engine

### 9.1 Query Pipeline

```
User Query → Query Analysis → Retrieval → Synthesis → Response + Sources
```

### 9.2 Query Analysis

Before retrieval, classify the query using Haiku:

```typescript
const QUERY_ANALYSIS_PROMPT = `Classify this organizational knowledge query:

QUERY: {query}

Respond with JSON:
{
  "intent": "factual" | "procedural" | "historical" | "comparative" | "exploratory",
  "time_scope": "current" | "specific_period" | "all_time",
  "categories": ["engineering", "support", ...],
  "entity_mentions": ["..."],
  "requires_graph_traversal": true | false
}`;
```

### 9.3 Retrieval Strategy

Based on query analysis, use one or more retrieval methods:

1. **Vector similarity search**: Embed query → find top-K similar knowledge units (K=20)
2. **Keyword search**: Full-text search on `title` and `content` columns (PostgreSQL `ts_vector`)
3. **Graph traversal**: If entities mentioned, find connected knowledge via entity relations
4. **Temporal filter**: If time-scoped, filter by `valid_from`/`valid_until`
5. **Category filter**: If categories identified, filter by `category`

Combine results with Reciprocal Rank Fusion (RRF):
```
RRF_score = Σ (1 / (k + rank_i)) for each retrieval method
k = 60 (constant)
```

Take top 10 results after fusion. Filter out `is_current = FALSE` unless query is explicitly historical.

### 9.4 Synthesis Prompt

```typescript
const SYNTHESIZE_ANSWER_PROMPT = `You are TribeMem, an AI that knows how this organization actually operates. Answer the user's question based ONLY on the retrieved organizational knowledge below.

RULES:
1. Answer based ONLY on the provided knowledge. If the knowledge doesn't contain the answer, say so.
2. Cite your sources using [1], [2], etc. — these correspond to the source links provided.
3. If knowledge is contradicted or flagged, mention the uncertainty.
4. If knowledge is old (confidence < 0.5 or last confirmed > 90 days ago), caveat it.
5. Be direct and practical — this is a team tool, not a formal report.
6. If the question asks about a process, describe it step-by-step.
7. If multiple versions of a fact exist, present the current one and note what changed.

RETRIEVED KNOWLEDGE:
{knowledge_units_with_sources}

USER QUESTION: {query}

Respond in clear, helpful prose. Include source citations.`;
```

### 9.5 Response Format

```typescript
interface QueryResponse {
  answer: string;                    // Synthesized answer with [1], [2] citations
  confidence: number;                // 0-1, based on underlying knowledge confidence
  sources: {
    index: number;                   // [1], [2], etc.
    title: string;
    source_url: string | null;       // Deep link to Slack message, Jira ticket, etc.
    connector_type: string;
    timestamp: string;
  }[];
  knowledge_units_used: string[];    // UUIDs for feedback tracking
  related_questions: string[];       // Suggested follow-ups
  metadata: {
    retrieval_time_ms: number;
    synthesis_time_ms: number;
    tokens_used: number;
  };
}
```

---

## 10. API Specification

### Base URL
```
https://api.tribemem.ai/v1
```

### Authentication
All API requests require either:
- `Authorization: Bearer tm_live_xxx` (API key)
- Session cookie (for frontend, handled by Supabase Auth)

### Endpoints

#### Query Knowledge
```
POST /v1/query
Content-Type: application/json
Authorization: Bearer tm_live_xxx

{
  "query": "How do we handle client escalations?",
  "filters": {
    "categories": ["support"],          // optional
    "types": ["process"],               // optional
    "time_scope": "current",            // "current" | "all_time" | {"from": "...", "to": "..."}
    "min_confidence": 0.3               // optional, default 0.3
  },
  "options": {
    "include_sources": true,            // default true
    "include_related": true,            // default true
    "max_knowledge_units": 10           // default 10
  }
}

Response: QueryResponse (see 9.5)
```

#### List Knowledge
```
GET /v1/knowledge?type=fact&category=engineering&status=active&page=1&limit=20
Authorization: Bearer tm_live_xxx

Response: {
  "data": KnowledgeUnit[],
  "pagination": { "page": 1, "limit": 20, "total": 142 }
}
```

#### Get Knowledge Unit
```
GET /v1/knowledge/:id
Authorization: Bearer tm_live_xxx

Response: KnowledgeUnit & {
  sources: Source[],
  versions: KnowledgeVersion[],
  related_entities: Entity[]
}
```

#### Get Knowledge History
```
GET /v1/knowledge/:id/history
Authorization: Bearer tm_live_xxx

Response: {
  "current": KnowledgeUnit,
  "versions": KnowledgeVersion[],
  "supersedes": KnowledgeUnit | null,
  "superseded_by": KnowledgeUnit | null
}
```

#### List Entities
```
GET /v1/entities?type=person&search=john&page=1&limit=20
Authorization: Bearer tm_live_xxx

Response: {
  "data": Entity[],
  "pagination": {...}
}
```

#### Get Entity Relations
```
GET /v1/entities/:id/relations
Authorization: Bearer tm_live_xxx

Response: {
  "entity": Entity,
  "relations": {
    "outgoing": EntityRelation[],
    "incoming": EntityRelation[]
  }
}
```

#### Connectors
```
GET    /v1/connectors                  # List connected systems
POST   /v1/connectors/:type/connect    # Initiate OAuth flow
DELETE /v1/connectors/:id              # Disconnect
PATCH  /v1/connectors/:id              # Update config (channel scoping, etc.)
POST   /v1/connectors/:id/sync        # Trigger manual sync
GET    /v1/connectors/:id/status       # Sync status + stats
```

#### Crawler
```
GET  /v1/crawler/status                # Overall crawler status
GET  /v1/crawler/runs?connector_id=x   # Crawler run history
POST /v1/crawler/pause                 # Pause all crawling
POST /v1/crawler/resume                # Resume crawling
```

#### Alerts
```
GET   /v1/alerts?type=contradiction&resolved=false
PATCH /v1/alerts/:id                   # Mark as read/resolved
```

#### Organization
```
GET   /v1/org                          # Current org info + usage
PATCH /v1/org                          # Update settings
GET   /v1/org/usage                    # Current period usage stats
```

#### API Keys
```
GET    /v1/api-keys                    # List keys (showing only prefix)
POST   /v1/api-keys                    # Create new key (returns full key ONCE)
DELETE /v1/api-keys/:id                # Revoke key
```

### Rate Limits
Enforced per API key:
| Plan | Requests/min | Queries/day |
|------|-------------|-------------|
| Starter | 60 | 100 |
| Growth | 120 | 500 |
| Business | 300 | 2000 |
| Enterprise | Custom | Custom |

Rate limit headers returned on every response:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 1700000000
```

---

## 11. MCP Server

### Overview
An MCP (Model Context Protocol) server that allows any compatible AI tool (Claude Desktop, Claude Code, Cursor, etc.) to query TribeMem's knowledge directly.

### Tools Exposed

#### `query_knowledge`
```json
{
  "name": "query_knowledge",
  "description": "Query your organization's institutional knowledge. Ask questions about how your team works, processes, past decisions, and organizational norms.",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Natural language question" },
      "category": { "type": "string", "enum": ["engineering", "support", "hr", "finance", "product", "operations", "sales", "general"] },
      "time_scope": { "type": "string", "enum": ["current", "all_time"] }
    },
    "required": ["query"]
  }
}
```

#### `get_process`
```json
{
  "name": "get_process",
  "description": "Get the current documented process for a specific workflow in your organization.",
  "input_schema": {
    "type": "object",
    "properties": {
      "process_name": { "type": "string", "description": "Name or description of the process" }
    },
    "required": ["process_name"]
  }
}
```

#### `list_recent_decisions`
```json
{
  "name": "list_recent_decisions",
  "description": "List recent organizational decisions with their rationale and context.",
  "input_schema": {
    "type": "object",
    "properties": {
      "category": { "type": "string" },
      "days": { "type": "number", "default": 30 }
    }
  }
}
```

#### `get_context`
```json
{
  "name": "get_context",
  "description": "Get full organizational context for a topic — facts, processes, decisions, and relevant people.",
  "input_schema": {
    "type": "object",
    "properties": {
      "topic": { "type": "string" }
    },
    "required": ["topic"]
  }
}
```

### MCP Auth
- Uses API key auth: user provides their TribeMem API key during MCP setup
- Key is passed as Bearer token in all tool requests

### MCP Server Implementation
- Built with `@modelcontextprotocol/sdk`
- Runs as a standalone Node.js process
- Published as npm package: `@tribemem/mcp-server`
- Setup: `npx @tribemem/mcp-server --api-key tm_live_xxx`

---

## 12. Frontend Application

### 12.1 Design System

- **Framework**: shadcn/ui + Tailwind CSS
- **Color scheme**: Dark mode primary, light mode supported
  - Primary: Blue-600 (#2563EB)
  - Background: Slate-950 (#020617) dark / White light
  - Surface: Slate-900 (#0F172A) dark / Slate-50 (#F8FAFC) light
  - Accent: Emerald-500 (#10B981) for success/active states
  - Warning: Amber-500 (#F59E0B)
  - Danger: Red-500 (#EF4444)
- **Typography**: Inter (body), JetBrains Mono (code/data)
- **Icons**: Lucide React
- **Animations**: Minimal, purposeful. Framer Motion for page transitions only.
- **Responsive**: Mobile-friendly but desktop-first (this is a team tool)

### 12.2 Pages & Components

#### Marketing Pages (`(marketing)/`)

**Homepage** (`page.tsx`):
- Hero: "Your team's knowledge, always current. Never ask the same question twice."
- Problem/solution section
- How it works (3 steps: Connect → Crawl → Query)
- Connector logos grid
- Social proof / testimonials
- CTA → Sign up

**Pricing** (`pricing/page.tsx`):
- Plan comparison table
- FAQ accordion

#### Auth Pages (`(auth)/`)
- Login (email/password + Google + GitHub)
- Signup (email/password + Google + GitHub)
- OAuth callback handler
- Organization creation (name + slug) after first signup

#### Dashboard (`(dashboard)/`)

**Layout** (`layout.tsx`):
- Left sidebar with navigation:
  - Overview (dashboard icon)
  - Ask (message-circle icon)
  - Knowledge (brain icon)
    - Facts
    - Processes
    - Decisions
    - Norms
  - Connectors (plug icon)
  - Crawler (bot icon)
  - Team (users icon)
  - Settings (settings icon)
    - General
    - Billing
    - API Keys
- Top bar: org name, user avatar, notification bell (alerts count)
- Main content area

**Overview** (`overview/page.tsx`):
- Stats cards: Total knowledge units, Active connectors, Queries this week, Alerts pending
- Recent knowledge chart (bar chart: knowledge units created per day, last 30 days)
- Recent queries list
- Active alerts list
- Connector status summary

**Ask / Chat** (`ask/page.tsx`):
- Full-screen chat interface
- Message input with send button
- Response includes: answer text, source citations (clickable links), confidence indicator, related questions as suggestion chips
- Chat history within session (not persisted across sessions — this is a query tool, not a chatbot)
- "Rate this answer" thumbs up/down after each response

**Knowledge Browser** (`knowledge/[type]/page.tsx`):
- Filterable table/card view of knowledge units
- Filters: type, category, confidence range, date range, status, tags
- Each knowledge unit card shows: title, type badge, category badge, confidence bar, source count, last confirmed date
- Click to expand: full content, source list (with deep links), version history timeline, related entities
- Superseded units shown with strikethrough + link to current version

**Connectors** (`connectors/page.tsx`):
- Grid of available connector cards (Slack, Notion, Jira, GitHub, etc.)
- Each card shows: logo, name, connection status, last sync time, events ingested count
- "Connect" button → OAuth flow
- Connected cards show: "Configure" (channel scoping), "Sync now", "Disconnect"
- Connector detail page: sync history, error logs, event stats

**Crawler** (`crawler/page.tsx`):
- Overall status: Running / Paused / Error
- Pause/Resume toggle
- Crawler runs table: connector, started, completed, events fetched, knowledge extracted, status
- Real-time log stream for active runs (via Supabase Realtime)

**Team** (`team/page.tsx`):
- Members table: name, email, role, joined date
- Invite form: email + role select
- Role management: change role, remove member

**Settings** (`settings/page.tsx`):
- Organization name, slug
- Crawl schedule configuration
- Excluded patterns (regex for content to ignore, e.g., standup bot messages)
- Retention period
- Danger zone: delete organization

**Billing** (`settings/billing/page.tsx`):
- Current plan badge
- Usage this period: queries, extractions, API calls, tokens
- Usage bar charts
- Upgrade/downgrade buttons → Stripe Checkout
- Invoice history

**API Keys** (`api-keys/page.tsx`):
- Keys table: name, prefix, created, last used, scopes
- "Create key" modal: name, scopes checkboxes
- Key shown ONCE after creation in a copy-able code block
- Delete/revoke button with confirmation

### 12.3 Key Frontend Components

```
components/
├── ui/                    # shadcn/ui primitives (button, input, card, dialog, etc.)
├── layout/
│   ├── Sidebar.tsx        # Navigation sidebar
│   ├── Header.tsx         # Top bar with org selector + user menu
│   └── Shell.tsx          # Dashboard layout wrapper
├── knowledge/
│   ├── KnowledgeCard.tsx  # Compact knowledge unit display
│   ├── KnowledgeDetail.tsx # Full knowledge unit with sources + history
│   ├── KnowledgeTable.tsx # Table view for knowledge browser
│   ├── ConfidenceBadge.tsx # Visual confidence indicator
│   ├── TypeBadge.tsx      # Fact/Process/Decision/Norm badge
│   ├── SourceLink.tsx     # Clickable source with connector icon
│   └── VersionTimeline.tsx # Visual timeline of knowledge versions
├── chat/
│   ├── ChatInterface.tsx  # Full chat UI
│   ├── ChatMessage.tsx    # Single message (user or AI)
│   ├── SourceCitations.tsx # Source links within answer
│   ├── SuggestionChips.tsx # Related question suggestions
│   └── FeedbackButtons.tsx # Thumbs up/down rating
├── connectors/
│   ├── ConnectorCard.tsx  # Connector with status
│   ├── ConnectorGrid.tsx  # Grid of all connectors
│   ├── ConnectorSetup.tsx # OAuth flow + channel config
│   └── SyncStatus.tsx     # Live sync status indicator
├── crawler/
│   ├── CrawlerStatus.tsx  # Overall status badge
│   ├── RunsTable.tsx      # Crawler runs history
│   └── LogStream.tsx      # Real-time log viewer
├── billing/
│   ├── PlanCard.tsx       # Plan display
│   ├── UsageBar.tsx       # Usage progress bar
│   └── InvoiceTable.tsx   # Invoice history
└── shared/
    ├── EmptyState.tsx     # Empty state illustrations
    ├── LoadingSkeleton.tsx # Loading placeholders
    ├── ErrorBoundary.tsx  # Error handling
    └── ConfirmDialog.tsx  # Confirmation modals
```

---

## 13. Background Jobs & Scheduling

### Queue Architecture (BullMQ + Redis)

```typescript
// Queue definitions
const QUEUES = {
  'crawl': {
    // Periodic crawl jobs per connector
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  },
  'extract': {
    // Knowledge extraction from raw events
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'fixed', delay: 10000 },
      removeOnComplete: 200,
    },
    limiter: {
      max: 10,       // Max concurrent extraction jobs
      duration: 1000, // Per second
    }
  },
  'synthesize': {
    // On-demand query synthesis
    defaultJobOptions: {
      attempts: 1,
      timeout: 30000, // 30s max for query answers
    }
  },
  'maintenance': {
    // Confidence decay, staleness checks, cleanup
    defaultJobOptions: {
      attempts: 1,
    }
  },
  'alert': {
    // Alert generation and notification dispatch
    defaultJobOptions: {
      attempts: 3,
    }
  }
};
```

### Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `crawl:{connector_id}` | Every 5 min (real-time connectors) or hourly (docs) | Fetch new events from connector |
| `extract:batch` | Every 1 min | Process pending raw events in batches |
| `maintenance:decay` | Daily at 3 AM UTC | Apply confidence decay to stale knowledge |
| `maintenance:staleness` | Daily at 4 AM UTC | Detect stale knowledge, generate alerts |
| `maintenance:cleanup` | Weekly on Sunday | Archive very old raw events, compact versions |
| `maintenance:token_reset` | Monthly on billing date | Reset usage counters |

### Job Flow

```
1. CRAWL JOB
   Input: { connectorId, orgId }
   Steps:
     a. Load connector config + credentials
     b. Refresh OAuth token if needed
     c. Fetch events since last cursor
     d. Insert into raw_events (status: pending)
     e. Update connector sync_cursor
     f. Enqueue extract jobs for new batches
     g. Update crawler_runs record

2. EXTRACT JOB
   Input: { orgId, rawEventIds[], connectorType }
   Steps:
     a. Load raw events
     b. Batch by context (thread, ticket, etc.)
     c. Call Haiku for fact extraction
     d. For each extracted fact:
        i.   Resolve entities against existing
        ii.  Check for duplicates (vector similarity > 0.95)
        iii. Check for contradictions (vector similarity > 0.8 + LLM check)
        iv.  Create/update knowledge_unit
        v.   Generate embedding
        vi.  Create source links
        vii. Create entity records + relations
     e. Update raw_events status to 'extracted'
     f. Create alerts for contradictions
     g. Update usage counters

3. SYNTHESIS JOB (query answering)
   Input: { orgId, queryText, filters, options }
   Steps:
     a. Analyze query (Haiku)
     b. Retrieve knowledge (vector + keyword + graph)
     c. Rerank with RRF
     d. Synthesize answer (Sonnet)
     e. Save to queries table
     f. Return response
```

---

## 14. Billing & Subscriptions

### Plan Definitions

```typescript
const PLANS = {
  free: {
    name: 'Free',
    price_eur: 0,
    max_connectors: 1,
    max_members: 3,
    max_queries_per_month: 50,
    max_knowledge_units: 500,
    max_api_calls_per_month: 100,
    retention_months: 1,
    features: ['basic_chat', 'basic_knowledge_browser'],
    stripe_price_id: null,
  },
  starter: {
    name: 'Starter',
    price_eur: 49,
    max_connectors: 3,
    max_members: 10,
    max_queries_per_month: 500,
    max_knowledge_units: 5000,
    max_api_calls_per_month: 1000,
    retention_months: 6,
    features: ['basic_chat', 'knowledge_browser', 'api_access', 'alerts'],
    stripe_price_id: 'price_starter_xxx',
  },
  growth: {
    name: 'Growth',
    price_eur: 149,
    max_connectors: 8,
    max_members: 50,
    max_queries_per_month: 2000,
    max_knowledge_units: 25000,
    max_api_calls_per_month: 5000,
    retention_months: 24,
    features: ['basic_chat', 'knowledge_browser', 'api_access', 'mcp_server', 'alerts', 'priority_support'],
    stripe_price_id: 'price_growth_xxx',
  },
  business: {
    name: 'Business',
    price_eur: 399,
    max_connectors: -1, // unlimited
    max_members: 200,
    max_queries_per_month: 10000,
    max_knowledge_units: -1, // unlimited
    max_api_calls_per_month: 25000,
    retention_months: -1, // unlimited
    features: ['all', 'sso', 'audit_log', 'custom_connectors', 'dedicated_support'],
    stripe_price_id: 'price_business_xxx',
  },
  enterprise: {
    name: 'Enterprise',
    price_eur: -1, // custom
    max_connectors: -1,
    max_members: -1,
    max_queries_per_month: -1,
    max_knowledge_units: -1,
    max_api_calls_per_month: -1,
    retention_months: -1,
    features: ['all', 'sso', 'audit_log', 'custom_connectors', 'on_prem', 'sla', 'dedicated_instance'],
    stripe_price_id: null, // custom
  },
};
```

### Stripe Integration

- Use Stripe Checkout for new subscriptions
- Use Stripe Customer Portal for plan changes, cancellations, invoice history
- Webhook events to handle:
  - `checkout.session.completed` → create subscription, update org plan
  - `invoice.paid` → log billing event
  - `invoice.payment_failed` → alert org owner, grace period 7 days
  - `customer.subscription.updated` → update org plan
  - `customer.subscription.deleted` → downgrade to free plan

### Usage Tracking

- Increment counters in `organizations.usage_this_period` JSONB
- Use Postgres `UPDATE ... SET usage_this_period = jsonb_set(...)` for atomic increments
- Check limits before each action:
  - Before query → check `max_queries_per_month`
  - Before extraction → check `max_knowledge_units`
  - Before API call → check `max_api_calls_per_month`
- Reset counters monthly via scheduled job

---

## 15. Security & Privacy

### Data Handling Principles

1. **Minimal extraction**: Extract organizational knowledge, NEVER personal data (PII)
2. **No content storage after extraction**: Raw events can be purged after extraction (configurable retention)
3. **Encryption at rest**: Supabase default encryption + Vault for OAuth tokens
4. **Encryption in transit**: TLS everywhere
5. **Org isolation**: RLS policies ensure strict tenant isolation
6. **No cross-org data**: Knowledge, entities, and everything is scoped to org_id

### Extraction Safety Rules (enforced in prompts AND post-processing)

The extraction engine MUST filter out:
- Email addresses, phone numbers, physical addresses
- Salary information, financial figures, revenue numbers
- API keys, passwords, tokens, secrets (regex pattern matching)
- Personal health information
- Customer PII (names are OK only when discussing process, not as data)

Post-extraction validation:
```typescript
const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,  // email
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,                           // phone
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,             // card number
  /\b(?:password|secret|token|api[_-]?key)\s*[:=]\s*\S+/i,    // credentials
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,                  // IP addresses
];

// Run on every extracted knowledge unit content before saving
function validateNoPII(content: string): { safe: boolean; violations: string[] }
```

### Channel/Scope Controls

- Admins configure which channels/repos/projects to monitor per connector
- Excluded channels are NEVER crawled (not even seen by the system)
- Excluded patterns (regex) filter out specific message types (e.g., bot messages, standup formats)

### API Security

- API keys hashed with SHA-256 before storage
- Rate limiting per key via Redis sliding window
- Request logging (query text + response metadata, NOT full response content)
- API key rotation: create new → migrate → delete old

---

## 16. Deployment & Infrastructure

### Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| Local | Development | http://localhost:3000 |
| Preview | PR previews (Vercel) | https://pr-{id}.tribemem.ai |
| Staging | Pre-production testing | https://staging.tribemem.ai |
| Production | Live | https://app.tribemem.ai |

### Frontend (Vercel)

- Framework preset: Next.js
- Build command: `turbo build --filter=web`
- Output directory: `apps/web/.next`
- Environment variables: set in Vercel dashboard
- Custom domain: `app.tribemem.ai`
- Edge middleware for auth checks

### Worker (Railway)

- Dockerfile in `apps/worker/`
- Persistent service (not serverless — needs long-running BullMQ processors)
- Autoscale: 1-3 instances based on queue depth
- Health check endpoint: `GET /health`
- Graceful shutdown: drain active jobs before stopping

### Redis (Railway or Upstash)

- Used for: BullMQ queues, rate limiting, caching
- Persistence: RDB snapshots every 5 minutes
- Memory limit: 256MB (starter), scale as needed

### Supabase

- Project per environment (dev, staging, prod)
- Migrations applied via Supabase CLI: `supabase db push`
- Backups: daily automatic (Supabase managed)
- Connection pooling: use Supabase's built-in PgBouncer

### DNS / Domain

- `tribemem.ai` — marketing site
- `app.tribemem.ai` — dashboard (Vercel)
- `api.tribemem.ai` — API (Vercel API routes or separate if needed)
- `mcp.tribemem.ai` — MCP server endpoint

### CI/CD

- GitHub Actions:
  - On PR: lint + type check + unit tests + Vercel preview deploy
  - On merge to main: deploy to staging
  - On release tag: deploy to production
  - Database migrations: run before deploy via `supabase db push`

---

## 17. Environment Variables

```bash
# .env.example

# ─── Supabase ───
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# ─── Anthropic ───
ANTHROPIC_API_KEY=sk-ant-xxx

# ─── OpenAI (for embeddings) ───
OPENAI_API_KEY=sk-xxx

# ─── Redis ───
REDIS_URL=redis://default:xxx@xxx.railway.app:6379

# ─── Stripe ───
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# ─── Resend ───
RESEND_API_KEY=re_xxx

# ─── Connector OAuth Credentials ───
SLACK_CLIENT_ID=xxx
SLACK_CLIENT_SECRET=xxx
SLACK_SIGNING_SECRET=xxx

NOTION_CLIENT_ID=xxx
NOTION_CLIENT_SECRET=xxx

GITHUB_APP_ID=xxx
GITHUB_APP_PRIVATE_KEY=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

JIRA_CLIENT_ID=xxx
JIRA_CLIENT_SECRET=xxx

INTERCOM_CLIENT_ID=xxx
INTERCOM_CLIENT_SECRET=xxx

LINEAR_CLIENT_ID=xxx
LINEAR_CLIENT_SECRET=xxx

GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

HUBSPOT_CLIENT_ID=xxx
HUBSPOT_CLIENT_SECRET=xxx

# ─── App ───
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_URL=http://localhost:3000/api
ENCRYPTION_KEY=xxx  # 32-byte hex for token encryption

# ─── Feature Flags ───
ENABLE_GRAPH_QUERIES=false  # Enable when AGE extension is available
ENABLE_MCP_SERVER=false     # Enable when MCP package is ready
```

---

## 18. Build Plan (Step-by-Step)

This is the ordered build plan. Each step should be completed and tested before moving to the next. Steps are grouped into phases.

### Phase 1: Foundation (Steps 1-10)

| # | Task | Details |
|---|------|---------|
| 1 | Initialize monorepo | Turborepo + pnpm workspace. Create `apps/web`, `apps/worker`, `packages/shared`. Configure TypeScript, ESLint, Prettier. |
| 2 | Set up Supabase | Create project. Run migrations 00001-00005 (orgs, members, connectors, raw_events, knowledge_units). Enable pgvector. |
| 3 | Set up Next.js app | Next.js 14 with App Router in `apps/web`. Install shadcn/ui, Tailwind, Lucide. Create base layout. |
| 4 | Implement auth | Supabase Auth with email/password + Google + GitHub. Login/signup pages. Auth middleware. |
| 5 | Organization creation | Post-signup flow: create org name + slug. Store in organizations table. Create owner member record. |
| 6 | Dashboard layout | Sidebar, header, shell component. All dashboard pages as stubs with empty states. |
| 7 | Shared types package | Define all TypeScript types in `packages/shared`. Knowledge unit, connector, query, etc. Zod validators. |
| 8 | Run remaining migrations | Migrations 00006-00017 (versions, entities, relations, sources, queries, api_keys, crawler_runs, alerts, billing, RLS). |
| 9 | Worker service setup | `apps/worker` with BullMQ. Redis connection. Queue definitions. Health check endpoint. Dockerfile. |
| 10 | Basic API routes | CRUD for organizations, members. Auth middleware for API routes. Role-based access checks. |

### Phase 2: Connector System (Steps 11-20)

| # | Task | Details |
|---|------|---------|
| 11 | Base connector interface | `BaseConnector` abstract class in `apps/worker/src/connectors/`. Auth URL generation, callback handling, token refresh, event fetching. |
| 12 | Slack connector | Full implementation: OAuth flow, `conversations.history` backfill, Events API webhook handler. Channel listing for scoping. |
| 13 | Connector management UI | Connector grid page. "Connect" button triggers OAuth. Status display. Channel/scope configuration modal. |
| 14 | Connector API routes | OAuth callback endpoint. Webhook receiver for Slack events. Connector CRUD endpoints. |
| 15 | Crawl queue implementation | BullMQ crawl queue. Scheduled crawl jobs per connector. Cursor-based incremental fetching. Crawler runs logging. |
| 16 | Notion connector | OAuth flow, search API sync, page content extraction (blocks to markdown). |
| 17 | Jira connector | OAuth flow (Atlassian), JQL search sync, issue + comments extraction. |
| 18 | GitHub connector | GitHub App installation flow, events API, PR + issues + comments extraction. |
| 19 | Crawler status UI | Crawler page with runs table, status indicators, pause/resume controls. |
| 20 | Connector error handling | Token refresh on 401. Retry logic. Error alerts. Connector status state machine. |

### Phase 3: Extraction Engine (Steps 21-30)

| # | Task | Details |
|---|------|---------|
| 21 | Anthropic client wrapper | `apps/worker/src/lib/anthropic.ts`. Token counting. Model selection. Error handling. Rate limiting. |
| 22 | Batch aggregation | Group raw events by context (thread, ticket, page). Respect 4K token limit per batch. |
| 23 | Fact extraction | Implement extraction prompt. Parse LLM JSON response. Validate output against Zod schema. |
| 24 | Entity extraction & resolution | Extract entities from facts. Match against existing entities in DB. Create new entities. Build aliases list. |
| 25 | Embedding generation | OpenAI embeddings API integration. Batch embedding calls. Store in pgvector column. |
| 26 | Deduplication | Before saving: vector similarity check against existing knowledge (>0.95 = duplicate). Merge sources if duplicate. |
| 27 | Contradiction detection | For similar but not identical knowledge (0.8-0.95 similarity): run Sonnet contradiction check. Create alerts for true contradictions. |
| 28 | Knowledge unit creation | Full pipeline: extract → resolve entities → deduplicate → check contradictions → save to DB → embed → link sources. |
| 29 | PII filtering | Regex-based post-extraction PII scan. Block knowledge units that contain PII patterns. Log blocked extractions. |
| 30 | Extraction queue | BullMQ extract queue. Process pending raw events in batches. Concurrency limiter. Token budget enforcement. |

### Phase 4: Query Engine & Chat (Steps 31-40)

| # | Task | Details |
|---|------|---------|
| 31 | Vector similarity search | pgvector cosine similarity query. Return top-K knowledge units. Filter by org, status, confidence. |
| 32 | Full-text search | PostgreSQL tsvector on knowledge title + content. Ranked results. |
| 33 | Hybrid retrieval + RRF | Combine vector + keyword results with Reciprocal Rank Fusion. Configurable weights. |
| 34 | Query analysis | Haiku-based query classifier. Intent, time scope, categories, entity mentions. |
| 35 | Answer synthesis | Sonnet-based synthesis with source citations. Confidence scoring. Related questions generation. |
| 36 | Chat interface UI | Full chat page. Message input. Streaming response display. Source citation links. Suggestion chips. |
| 37 | Query API endpoint | `POST /v1/query`. Auth, rate limiting, usage tracking. Full pipeline: analyze → retrieve → synthesize. |
| 38 | Query feedback | Thumbs up/down on responses. Store in queries table. Use for quality monitoring. |
| 39 | Knowledge browser UI | Table/card view of all knowledge. Filters (type, category, confidence, date). Detail view with sources + versions. |
| 40 | Entity browser UI | Entity list with type filter. Entity detail page showing relations and associated knowledge. |

### Phase 5: Knowledge Management (Steps 41-45)

| # | Task | Details |
|---|------|---------|
| 41 | Temporal versioning | When knowledge is updated: create version record, update current unit, set superseded links. Version history timeline component. |
| 42 | Confidence decay job | Daily maintenance job. Apply decay formula. Flag stale knowledge. Generate alerts. |
| 43 | Process drift detection | Compare process-type knowledge against recent raw events. Alert when documented process doesn't match observed behavior. |
| 44 | Alerts system | Alert creation, display, read/resolve. Notification bell in header with count. Alert detail modal with related knowledge links. |
| 45 | Entity relations graph | Store and query entity relations. Graph visualization component (simple force-directed or tree layout using D3 or recharts). |

### Phase 6: API, SDK & MCP (Steps 46-50)

| # | Task | Details |
|---|------|---------|
| 46 | Public API | All v1 endpoints from section 10. OpenAPI spec generation. API documentation page. |
| 47 | API key management | Create, list, revoke API keys. Hash storage. Rate limiting per key. Usage tracking. |
| 48 | API key auth middleware | Validate Bearer token. Look up org from key. Enforce rate limits. |
| 49 | TypeScript SDK | `packages/sdk`. Typed client wrapping all API endpoints. Published to npm as `@tribemem/sdk`. |
| 50 | MCP server | `packages/mcp-server`. Implements 4 tools (query, get_process, list_decisions, get_context). Auth via API key. npm package. |

### Phase 7: Billing & Polish (Steps 51-60)

| # | Task | Details |
|---|------|---------|
| 51 | Stripe integration | Checkout sessions for new subscriptions. Customer portal for management. Webhook handler. |
| 52 | Usage tracking & limits | Atomic counter increments. Limit enforcement on queries, extractions, API calls. Usage dashboard. |
| 53 | Billing UI | Current plan display. Usage bars. Upgrade/downgrade buttons. Invoice history. |
| 54 | Team management | Invite via email (Resend). Accept invite flow. Role management. Remove member. |
| 55 | Settings pages | Org settings. Crawl configuration. Excluded patterns. Retention period. Danger zone. |
| 56 | Marketing homepage | Landing page with hero, features, how-it-works, pricing, CTA. |
| 57 | Onboarding flow | After signup: guided setup wizard — create org → connect first system → wait for first crawl → ask first question. |
| 58 | Additional connectors | Intercom, Linear, Google Drive, HubSpot. Follow base connector pattern. |
| 59 | Error handling & edge cases | Global error boundary. Toast notifications. Empty states. Loading skeletons. Offline handling. |
| 60 | Testing & QA | Unit tests for extraction pipeline, dedup, contradiction detection. Integration tests for API endpoints. E2E tests for critical flows (connect → crawl → query). |

---

## Appendix A: Key Design Decisions

1. **PostgreSQL over separate vector/graph DBs**: Co-locating relational + vector + graph data in one Postgres instance (via pgvector + AGE) reduces operational complexity. We accept slightly lower performance vs. dedicated vector DBs — the knowledge volume per org (thousands, not millions) makes this fine.

2. **Haiku for extraction, Sonnet for synthesis**: Extraction is high-volume, structured output — Haiku handles this well at 1/10th the cost. Synthesis is user-facing and needs nuance — Sonnet is worth the cost here.

3. **No real-time streaming for extraction results**: Extraction happens in background workers. Users see results in the dashboard after processing. This simplifies the architecture and avoids false expectations of instant knowledge.

4. **Temporal versioning over simple overwrites**: This is a core differentiator. Never deleting knowledge (only superseding) enables historical queries and audit trails, which is critical for the compliance/consulting target market.

5. **Org-scoped, not user-scoped**: Unlike Mem0/Supermemory, every piece of knowledge belongs to the organization, not to an individual user. This is the fundamental product decision that separates TribeMem from personal memory tools.

6. **Connector-agnostic knowledge**: After extraction, knowledge units are connector-agnostic. A fact about "our SLA is 4 hours" might come from Slack, Intercom, and Jira combined. The knowledge doesn't belong to any one system.

## Appendix B: Future Roadmap (Post-MVP)

- **Microsoft Teams connector**
- **Confluence connector**
- **Salesforce connector**
- **Custom webhook connector** (for any system with webhooks)
- **Knowledge suggestions** ("Based on recent conversations, should we update this process?")
- **Process visualization** (auto-generated flowcharts from process-type knowledge)
- **Slack bot** (query TribeMem directly from Slack: `/tribal how do we handle refunds?`)
- **Weekly digest emails** (new knowledge, updated processes, unresolved contradictions)
- **SSO/SAML** (enterprise)
- **On-premise deployment** (enterprise)
- **Multi-language support** (extract from Dutch/German/French Slack channels)
- **Meeting transcript integration** (Otter.ai, Fireflies, Grain)
- **Knowledge export** (generate up-to-date wiki/handbook from knowledge graph on demand)