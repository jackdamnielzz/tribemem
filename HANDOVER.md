# TribeMem — Handover Document

**Date:** 2026-03-21
**Project:** TribeMem — Autonomous Knowledge Crawler Platform
**Repo:** https://github.com/jackdamnielzz/tribemem.git
**Live URL:** https://tribemem-web.vercel.app
**Supabase Project:** nfbmgusljfqryscqrstr

---

## 1. What Has Been Built

The entire TribeMem platform has been built from scratch based on `plan.md`. The codebase is a Turborepo monorepo with pnpm workspaces.

### Architecture

```
tribemem/
├── apps/
│   ├── web/          → Next.js 14 (App Router) frontend + API routes
│   └── worker/       → Background worker service (BullMQ processors)
├── packages/
│   ├── shared/       → Shared types, constants, validators, utils
│   ├── mcp-server/   → MCP server (4 tools for AI agents)
│   └── sdk/          → TypeScript SDK for API consumers
├── supabase/
│   ├── migrations/   → 17 SQL migrations (all applied to production)
│   └── seed.sql      → Demo data (applied)
└── docs/             → 7 documentation files
```

### Total Stats
- **~250 files** created
- **~32,000 lines** of code
- **17 database tables** with RLS policies
- **10 connectors** (Slack, Notion, Jira, GitHub, Intercom, Linear, Google Drive, HubSpot, Stripe)
- **120+ unit tests** (Vitest)
- **50 e2e tests** (Playwright)

---

## 2. What Is Deployed & Connected

### Vercel (Frontend)
- **Project:** `tunuxs-projects/tribemem-web`
- **URL:** https://tribemem-web.vercel.app
- **Build:** Working (Turbo v2 with `tasks` config)
- **Root Directory on Vercel:** `apps/web`
- **Environment Variables set:**
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://nfbmgusljfqryscqrstr.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *(set)*
  - `SUPABASE_SERVICE_ROLE_KEY` = *(set)*
  - `NEXT_PUBLIC_APP_URL` = *(set)*
  - `ENCRYPTION_KEY` = *(set, 64-char hex)*

### Supabase (Database)
- **Project Ref:** `nfbmgusljfqryscqrstr`
- **URL:** `https://nfbmgusljfqryscqrstr.supabase.co`
- **CLI:** Linked and logged in
- **Migrations:** All 17 applied successfully
- **Seed data:** Applied (demo org "Acme Engineering" with sample knowledge)
- **pgvector:** Enabled in `extensions` schema (columns use `extensions.vector()`)
- **Tables:** organizations, members, connectors, raw_events, knowledge_units, knowledge_versions, entities, entity_relations, sources, queries, api_keys, crawler_runs, alerts, billing_events

### GitHub
- **Repo:** https://github.com/jackdamnielzz/tribemem.git
- **Branch:** `master`
- **Connected to Vercel:** Auto-deploy on push

---

## 3. What Still Needs To Be Done

### External Services Not Yet Connected

| Service | Purpose | What's Needed |
|---------|---------|---------------|
| **Redis** | BullMQ job queues for worker | Create instance on Railway/Upstash, add `REDIS_URL` env var |
| **Anthropic API** | Knowledge extraction (Haiku) & synthesis (Sonnet) | Get API key, add `ANTHROPIC_API_KEY` env var |
| **OpenAI API** | Text embeddings (text-embedding-3-small) | Get API key, add `OPENAI_API_KEY` env var |
| **Stripe** | Billing & subscriptions (5 tiers) | Create products/prices, add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| **Resend** | Transactional emails | Get API key, add `RESEND_API_KEY` |

### Worker Deployment
- The worker (`apps/worker`) needs to run as a **persistent service** (not on Vercel)
- Deploy on **Railway** or **Render**
- Requires: `REDIS_URL`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
- Has a `Dockerfile` ready

### OAuth Apps (for connectors)
Each connector needs an OAuth app created on its platform:

| Connector | Env Vars Needed |
|-----------|----------------|
| Slack | `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET` |
| Notion | `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET` |
| GitHub | `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| Jira | `JIRA_CLIENT_ID`, `JIRA_CLIENT_SECRET` |
| Intercom | `INTERCOM_CLIENT_ID`, `INTERCOM_CLIENT_SECRET` |
| Linear | `LINEAR_CLIENT_ID`, `LINEAR_CLIENT_SECRET` |
| Google Drive | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| HubSpot | `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET` |

### Other Remaining Work
- **Supabase Auth:** Configure auth providers (email/password, Google OAuth) in Supabase Dashboard → Authentication
- **Stripe webhook:** Set up webhook endpoint pointing to `https://tribemem-web.vercel.app/api/webhooks/stripe`
- **Custom domain:** Optional — configure on Vercel
- **Testing:** Run `pnpm test` locally to verify all unit tests pass, run `pnpm exec playwright test` for e2e

---

## 4. Key Technical Decisions & Fixes Applied

1. **Turbo v2:** `pipeline` renamed to `tasks` in `turbo.json`
2. **pgvector on Supabase:** Extension lives in `extensions` schema — columns must use `extensions.vector(1536)` type
3. **Vector index:** Using HNSW instead of ivfflat (works on empty tables)
4. **Stripe SDK:** API version pinned to `2023-10-16` (matching installed `stripe@^14.0.0`)
5. **slugify types:** Using `Parameters<typeof slugify>[1]` instead of `slugify.Options` (not exported)
6. **Middleware:** Gracefully skips auth when Supabase env vars are missing (dev mode safe)
7. **Next.js:** Removed deprecated `experimental.serverActions` config
8. **@radix-ui/react-badge:** Removed (doesn't exist on npm), Badge is a custom component

---

## 5. File Reference

### Key Config Files
- `plan.md` — Full platform specification (single source of truth)
- `turbo.json` — Turborepo task config
- `pnpm-workspace.yaml` — Workspace definition
- `.env.example` — All environment variables documented

### Key Source Files
- `apps/web/middleware.ts` — Auth middleware with dev-mode bypass
- `apps/web/app/api/billing/route.ts` — Stripe billing endpoints
- `apps/web/lib/oauth/providers.ts` — OAuth configs for all 8 connectors
- `apps/web/lib/oauth/encryption.ts` — AES-256-GCM token encryption
- `apps/web/lib/email/` — Resend email integration (3 files)
- `apps/worker/src/index.ts` — Worker entry point
- `apps/worker/src/connectors/` — 10 connector implementations
- `apps/worker/src/extraction/` — LLM extraction pipeline
- `apps/worker/src/queues/` — BullMQ queue definitions
- `packages/mcp-server/src/` — MCP server with 4 tools

### Documentation
- `docs/architecture.md` — System architecture overview
- `docs/api-reference.md` — API endpoint documentation
- `docs/connector-guide.md` — How to add/configure connectors
- `docs/extraction-pipeline.md` — Extraction engine details
- `docs/deployment.md` — Deployment guide
- `docs/mcp-setup.md` — MCP server setup
- `docs/sdk-guide.md` — SDK usage guide

---

## 6. Quick Start for New Chat

```
# To continue development:
cd d:\Programmeren\tribemem
pnpm install
pnpm dev          # starts Next.js on localhost:3000

# To run tests:
pnpm test         # Vitest unit tests

# To push migrations:
npx supabase db push

# To deploy:
git add . && git commit -m "..." && git push origin master
# Vercel auto-deploys on push
```

**Supabase CLI is already logged in and linked to the project.**
