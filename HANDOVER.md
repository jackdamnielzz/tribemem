# TribeMem — Handover Document

**Date:** 2026-03-22
**Project:** TribeMem — Autonomous Knowledge Crawler Platform
**Repo:** https://github.com/jackdamnielzz/tribemem.git
**Live URL:** https://tribemem.com
**Supabase Project:** nfbmgusljfqryscqrstr

---

## 1. Current Status

The full codebase is built, deployed, and all builds + tests pass.

- **Build:** 5/5 packages compile successfully
- **Tests:** 177 unit tests passing across 4 packages (shared: 144, worker: 16, sdk: 17)
- **Deploy:** Vercel auto-deploys on push to `master`
- **Live URL:** https://tribemem.com (custom domain connected)
- **Last commit:** `8aeba8f` — Fix build and test errors across worker, mcp-server, and shared packages

The platform is **code-complete** but not yet **operational** — external services (Redis, AI APIs) need to be connected before crawling and knowledge extraction can run. Auth and billing infrastructure are fully configured.

---

## 2. What Has Been Built

Turborepo monorepo with pnpm workspaces, built from `plan.md`.

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

### Stats
- ~250 files, ~32,000 lines of code
- 17 database tables with RLS policies
- 10 connectors (Slack, Notion, Jira, GitHub, Intercom, Linear, Google Drive, HubSpot, Stripe)
- 177 unit tests (Vitest), 50 e2e tests (Playwright)

---

## 3. What Is Deployed & Connected

### Vercel (Frontend)
- **Project:** `tunuxs-projects/tribemem-web`
- **URL:** https://tribemem.com (custom domain)
- **Alt URL:** https://tribemem-web.vercel.app (still works)
- **Build:** Working (Turbo v2 with `tasks` config)
- **Root Directory on Vercel:** `apps/web`
- **Environment Variables set:**
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://nfbmgusljfqryscqrstr.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *(set)*
  - `SUPABASE_SERVICE_ROLE_KEY` = *(set)*
  - `NEXT_PUBLIC_APP_URL` = `https://tribemem.com`
  - `ENCRYPTION_KEY` = *(set, 64-char hex)*
  - `STRIPE_SECRET_KEY` = *(set, test mode)*
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = *(set, test mode)*
  - `STRIPE_WEBHOOK_SECRET` = *(set)*
  - `STRIPE_PRICE_STARTER_MONTHLY` = `price_1TDhlZJ0i8NWlAF12GpFPALl`
  - `STRIPE_PRICE_STARTER_YEARLY` = `price_1TDhpcJ0i8NWlAF1M8TWGAxR`
  - `STRIPE_PRICE_GROWTH_MONTHLY` = `price_1TDhqVJ0i8NWlAF1VEvlprXo`
  - `STRIPE_PRICE_GROWTH_YEARLY` = `price_1TDhqkJ0i8NWlAF1sIFaZo5U`
  - `STRIPE_PRICE_BUSINESS_MONTHLY` = `price_1TDhr9J0i8NWlAF1jrjiZSpL`
  - `STRIPE_PRICE_BUSINESS_YEARLY` = `price_1TDhrOJ0i8NWlAF101I9aUqh`
  - `REDIS_URL` = *(set)*
  - `ANTHROPIC_API_KEY` = *(set)*
  - `OPENAI_API_KEY` = *(set)*
  - `DATABASE_URL` = *(set)*

### Custom Domain (tribemem.com)
- **Registrar:** Namecheap
- **DNS:** A records pointing to `76.76.21.21` (Vercel)
- **SSL:** Automatic via Vercel
- **www.tribemem.com:** Also configured

### Supabase (Database + Auth)
- **Project Ref:** `nfbmgusljfqryscqrstr`
- **URL:** `https://nfbmgusljfqryscqrstr.supabase.co`
- **CLI:** Linked and logged in
- **Migrations:** All 17 applied successfully
- **Seed data:** Applied (demo org "Acme Engineering" with sample knowledge)
- **pgvector:** Enabled in `extensions` schema (columns use `extensions.vector()`)
- **Tables:** organizations, members, connectors, raw_events, knowledge_units, knowledge_versions, entities, entity_relations, sources, queries, api_keys, crawler_runs, alerts, billing_events
- **Auth configured:**
  - Email provider: Enabled (with email confirmation)
  - Site URL: `https://tribemem.com`
  - Redirect URLs: `https://tribemem.com/callback`, `http://localhost:3000/callback`
  - Google/GitHub OAuth: Not yet configured (optional)

### Stripe (Billing)
- **Account:** Dunningdog (shared with other SaaS)
- **Mode:** Test mode
- **Products created (test mode):**
  - TribeMem Starter: €49/month + €470/year
  - TribeMem Growth: €149/month + €1,430/year
  - TribeMem Business: €399/month + €3,830/year
- **Webhook:** `https://tribemem.com/api/webhooks/stripe` (active, verified working)
  - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
- **Note:** When going live, create new products in live mode and update all `STRIPE_PRICE_*` env vars + `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`

### GitHub
- **Repo:** https://github.com/jackdamnielzz/tribemem.git
- **Branch:** `master`
- **Connected to Vercel:** Auto-deploy on push

---

## 4. What Still Needs To Be Done

### Priority 1 — Worker Deployment

- The worker (`apps/worker`) needs to run as a **persistent service** (not on Vercel)
- Deploy on **Railway** or **Render**
- Requires: `REDIS_URL`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
- Has a `Dockerfile` ready
- All env vars are already set on Vercel — copy them to the worker hosting platform

### Priority 2 — Missing Auth Pages & Flows

Auth is configured and working (email/password login + signup). These pages/flows still need code:

- `/forgot-password` — password reset page (link exists on login page but route does not)
- Email verification/confirmation page after signup
- Organization creation flow after first signup (user signs up → needs to create or join an org)
- Terms of Service page (link exists on signup page)
- Privacy Policy page (link exists on signup page)
- Google/GitHub OAuth providers (optional — enable in Supabase Dashboard → Sign In / Providers)
- SSO/SAML (planned for enterprise tier per `plan.md`)

### Priority 3 — Billing Completion

Stripe products, webhook, and price ID mapping are all done. Remaining billing work:

1. **Payment failure handling:**
   - 7-day grace period logic (per `plan.md`)
   - Auto-downgrade to free after grace period expires (BullMQ delayed job or cron)

2. **Usage tracking and limit enforcement:**
   - Increment `organizations.usage_this_period` JSONB counters on each query, extraction, API call
   - Check limits before operations (compare against `PlanLimits` from `plans.ts`)
   - Monthly reset job for usage counters (cron or BullMQ repeatable job)

3. **Billing UI** (current page at `/settings/billing` has hardcoded data):
   - Dynamic plan display with real usage data from API
   - Plan upgrade/downgrade buttons that call the billing API (`POST /api/billing` for checkout, `PUT` for plan change)
   - Invoice history (via Stripe API or `billing_events` table)
   - Cancel subscription button (`DELETE /api/billing`)

4. **Go live:** When ready for production payments:
   - Create products/prices in Stripe **live mode**
   - Update all `STRIPE_PRICE_*`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` env vars on Vercel
   - Create a new webhook endpoint in Stripe live mode pointing to `https://tribemem.com/api/webhooks/stripe`

### Priority 4 — Connector OAuth Apps

Each connector needs an OAuth app created on its respective platform. The OAuth flow code is **fully implemented** (`apps/web/lib/oauth/providers.ts`, `apps/web/app/api/auth/connectors/callback/route.ts`) including token exchange and AES-256-GCM credential encryption.

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

### Priority 5 — Nice-to-haves

- **Resend** for transactional emails (`RESEND_API_KEY`) — email templates already exist in `apps/web/lib/email/`
- **E2E tests:** `pnpm exec playwright test` — 50 Playwright tests exist but need a running app + database

---

## 5. Key Technical Decisions & Fixes Applied

### Original Fixes (previous sessions)
1. **Turbo v2:** `pipeline` renamed to `tasks` in `turbo.json`
2. **pgvector on Supabase:** Extension lives in `extensions` schema — columns must use `extensions.vector(1536)` type
3. **Vector index:** Using HNSW instead of ivfflat (works on empty tables)
4. **Stripe SDK:** API version pinned to `2023-10-16` (matching installed `stripe@^14.0.0`)
5. **slugify types:** Using `Parameters<typeof slugify>[1]` instead of `slugify.Options` (not exported)
6. **Middleware:** Gracefully skips auth when Supabase env vars are missing (dev mode safe)
7. **Next.js:** Removed deprecated `experimental.serverActions` config
8. **@radix-ui/react-badge:** Removed (doesn't exist on npm), Badge is a custom component

### Fixes Applied This Session (2026-03-21)
9. **Vitest config:** Added `vitest.config.ts` to `shared`, `sdk`, and `worker` packages — Vitest 1.x on Node 24 crashes without an explicit config file
10. **MCP server tools:** Added type assertions for `response.json()` return values (TypeScript `unknown` type errors in all 4 tool files)
11. **crawl.queue.ts JSDoc:** `*/6` in cron example was interpreted as end-of-comment by TypeScript — changed to `0/6`
12. **ioredis version conflict:** Pinned ioredis to `5.9.3` to match BullMQ's bundled version (was `^5.3.0` resolving to `5.10.1`, causing type incompatibility)
13. **BullMQ Pro-only options:** Removed `rateLimiter` and `group` from `extract.queue.ts` (these are BullMQ Pro features, not available in open-source)
14. **Queue null-return pattern:** All queue singleton getters (`crawl`, `sync`, `extract`) used an intermediate variable to avoid TypeScript narrowing issue with module-scoped `| null` variables
15. **jira.connector.ts:** Added explicit `as string` cast for `reporter` displayName
16. **entity-resolver.ts:** Replaced `.catch()` with `.then(noop, handler)` — Supabase `PostgrestFilterBuilder` doesn't have a `.catch()` method
17. **synthesize.processor.ts:** Added `fusedScore: 0` to vector results before passing to `reciprocalRankFusion()` (required by `ScoredKnowledge` interface)
18. **extractor.test.ts:** Added missing `RawEvent` fields (`event_type`, `author_external_id`, `author_name`, `raw_payload`, `processed`, `processed_at`) and imported `ConnectorType`

### Changes Applied This Session (2026-03-22)
19. **Custom domain:** Connected `tribemem.com` (+ `www.tribemem.com`) to Vercel via Namecheap DNS A records → `76.76.21.21`
20. **Supabase Auth configured:** Email provider enabled, Site URL set to `https://tribemem.com`, redirect URLs added (`https://tribemem.com/callback`, `http://localhost:3000/callback`)
21. **Stripe products created (test mode):** TribeMem Starter (€49/mo, €470/yr), Growth (€149/mo, €1,430/yr), Business (€399/mo, €3,830/yr) — all with EUR pricing
22. **Stripe webhook endpoint:** Created `https://tribemem.com/api/webhooks/stripe` listening to 5 events, signing secret verified working
23. **Stripe webhook handler rewritten** (`apps/web/app/api/webhooks/stripe/route.ts`): Signature verification enabled via `stripe.webhooks.constructEvent()`, all 5 event handlers implemented with real DB updates (checkout → update org plan, subscription updated/deleted → plan change/downgrade, invoice succeeded/failed → billing_events + alerts)
24. **Stripe price ID mapping added:** `stripe_price_id_monthly` / `stripe_price_id_yearly` fields added to `Plan` interface and `PLANS` constant, reading from env vars (`STRIPE_PRICE_STARTER_MONTHLY`, etc.). Added `getPlanByStripePriceId()` helper function to reverse-lookup a plan from a Stripe price ID
25. **Vercel env vars:** Set all Stripe price IDs, webhook secret, and updated `NEXT_PUBLIC_APP_URL` to `https://tribemem.com`

---

## 6. File Reference

### Key Config Files
- `plan.md` — Full platform specification (single source of truth)
- `turbo.json` — Turborepo task config
- `pnpm-workspace.yaml` — Workspace definition
- `.env.example` — All environment variables documented

### Key Source Files
- `apps/web/middleware.ts` — Auth middleware with dev-mode bypass
- `apps/web/app/api/billing/route.ts` — Stripe billing endpoints (GET/POST/PUT/DELETE)
- `apps/web/app/api/webhooks/stripe/route.ts` — Stripe webhook handler (5 event types)
- `apps/web/lib/oauth/providers.ts` — OAuth configs for all 8 connectors
- `apps/web/lib/oauth/encryption.ts` — AES-256-GCM token encryption
- `apps/web/lib/email/` — Resend email integration (3 files)
- `apps/worker/src/index.ts` — Worker entry point
- `apps/worker/src/connectors/` — 10 connector implementations
- `apps/worker/src/extraction/` — LLM extraction pipeline
- `apps/worker/src/queues/` — BullMQ queue definitions (crawl, sync, extract)
- `apps/worker/src/processors/` — Job processors (synthesize)
- `apps/worker/src/lib/redis.ts` — Redis connection management
- `packages/mcp-server/src/` — MCP server with 4 tools
- `packages/shared/src/types/connector.ts` — RawEvent, Connector, ConnectorType types

### Documentation
- `docs/architecture.md` — System architecture overview
- `docs/api-reference.md` — API endpoint documentation
- `docs/connector-guide.md` — How to add/configure connectors
- `docs/extraction-pipeline.md` — Extraction engine details
- `docs/deployment.md` — Deployment guide
- `docs/mcp-setup.md` — MCP server setup
- `docs/sdk-guide.md` — SDK usage guide

---

## 7. Quick Start for New Chat

```bash
# To continue development:
cd d:\Programmeren\tribemem
pnpm install
pnpm dev          # starts Next.js on localhost:3000

# To build:
pnpm build        # builds all 5 packages

# To run tests:
pnpm test         # 177 Vitest unit tests across 4 packages

# To push migrations:
npx supabase db push

# To deploy:
git add . && git commit -m "..." && git push origin master
# Vercel auto-deploys on push
```

**Supabase CLI is already logged in and linked to the project.**

### Next Steps for New Session
1. Deploy worker to Railway/Render (Dockerfile ready, env vars already on Vercel — copy them)
2. Implement missing auth pages: `/forgot-password`, org creation post-signup flow
3. Make billing UI dynamic (currently hardcoded data in `/settings/billing`)
4. Implement usage tracking, limit enforcement, and monthly reset job
5. Create OAuth apps for connectors as needed
6. Go live on Stripe: create live mode products/prices, update env vars
