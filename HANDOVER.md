# TribeMem — Handover Document

**Date:** 2026-03-23
**Project:** TribeMem — Autonomous Knowledge Crawler Platform
**Repo:** https://github.com/jackdamnielzz/tribemem.git
**Live URL:** https://tribemem.com
**Supabase Project:** nfbmgusljfqryscqrstr

---

## 1. Current Status

The full codebase is built, deployed, and all builds + tests pass. All 5 original priorities have been completed.

- **Build:** 5/5 packages compile successfully
- **Tests:** 177 unit tests passing across 4 packages (shared: 144, worker: 16, sdk: 17)
- **Deploy:** Vercel auto-deploys on push to `master`; worker running on Railway
- **Live URL:** https://tribemem.com (custom domain connected)
- **Worker URL:** https://worker-production-c86e.up.railway.app/health
- **Last commit:** `5245f3d` — Wire up Resend email notifications and E2E test auth setup

The platform is **fully operational** with all auth flows, billing (Stripe live mode, USD), 4 connector OAuth apps (GitHub, Slack, Notion, Google Drive), email notifications (Resend), and scheduled jobs configured.

---

## 2. What Has Been Built

Turborepo monorepo with pnpm workspaces, built from `plan.md`.

```
tribemem/
├── apps/
│   ├── web/          → Next.js 14 (App Router) frontend + API routes
│   └── worker/       → Background worker service (BullMQ, 6 processors)
├── packages/
│   ├── shared/       → Shared types, constants, validators, utils
│   ├── mcp-server/   → MCP server (4 tools for AI agents)
│   └── sdk/          → TypeScript SDK for API consumers
├── supabase/
│   ├── migrations/   → 19 SQL migrations (all applied to production)
│   └── seed.sql      → Demo data (applied)
└── docs/             → 7 documentation files
```

### Stats
- ~280 files, ~35,000 lines of code
- 17 database tables with RLS policies
- 10 connectors (Slack, Notion, Jira, GitHub, Intercom, Linear, Google Drive, HubSpot, Stripe)
- 177 unit tests (Vitest), 43 e2e tests (Playwright)
- 6 BullMQ workers: crawl, extract, synthesize, alert, billing, digest

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
  - `STRIPE_SECRET_KEY` = *(set, live mode)*
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = *(set, live mode)*
  - `STRIPE_WEBHOOK_SECRET` = *(set, live mode)*
  - `STRIPE_PRICE_STARTER_MONTHLY` = `price_1TE3ARJ0i8NWlAF1pTjSqlUA`
  - `STRIPE_PRICE_STARTER_YEARLY` = `price_1TE3E0J0i8NWlAF11SNcU8X2`
  - `STRIPE_PRICE_GROWTH_MONTHLY` = `price_1TE3CpJ0i8NWlAF174SeLmNR`
  - `STRIPE_PRICE_GROWTH_YEARLY` = `price_1TE3EEJ0i8NWlAF1dgUagi6n`
  - `STRIPE_PRICE_BUSINESS_MONTHLY` = `price_1TE3EdJ0i8NWlAF1HABargAU`
  - `STRIPE_PRICE_BUSINESS_YEARLY` = `price_1TE3EuJ0i8NWlAF1VNfFPBxQ`
  - `REDIS_URL` = *(set)*
  - `ANTHROPIC_API_KEY` = *(set)*
  - `OPENAI_API_KEY` = *(set)*
  - `DATABASE_URL` = *(set)*
  - `RESEND_API_KEY` = *(set)*
  - `GITHUB_CLIENT_ID` = *(set)*
  - `GITHUB_CLIENT_SECRET` = *(set)*
  - `SLACK_CLIENT_ID` = *(set)*
  - `SLACK_CLIENT_SECRET` = *(set)*
  - `SLACK_SIGNING_SECRET` = *(set)*
  - `NOTION_CLIENT_ID` = *(set)*
  - `NOTION_CLIENT_SECRET` = *(set)*
  - `GOOGLE_CLIENT_ID` = *(set)*
  - `GOOGLE_CLIENT_SECRET` = *(set)*

### Railway (Worker)
- **Service:** Worker deployed via Docker (`apps/worker/Dockerfile`)
- **Health check:** https://worker-production-c86e.up.railway.app/health
- **Workers running:** crawl, extract, synthesize, alert, billing, digest
- **Scheduled jobs:**
  - Usage reset: hourly at :00
  - Grace period check: hourly at :30
  - Weekly digest: Mondays at 09:00 UTC
- **Environment Variables:** Same as Vercel (REDIS_URL, SUPABASE keys, AI API keys, etc.)
- **Environment Variables:** Same as Vercel including all OAuth, Stripe live, and Resend keys

### Custom Domain (tribemem.com)
- **Registrar:** Namecheap
- **DNS:** A records pointing to `76.76.21.21` (Vercel)
- **SSL:** Automatic via Vercel
- **www.tribemem.com:** Also configured

### Supabase (Database + Auth)
- **Project Ref:** `nfbmgusljfqryscqrstr`
- **URL:** `https://nfbmgusljfqryscqrstr.supabase.co`
- **CLI:** Linked and logged in
- **Migrations:** All 19 applied successfully (including `increment_usage` RPC and connector type updates)
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
- **Mode:** Live mode (USD pricing)
- **Products created (live mode):**
  - TribeMem Starter: $49/month + $470/year
  - TribeMem Growth: $149/month + $1,430/year
  - TribeMem Business: $399/month + $3,830/year
- **Webhook:** `https://tribemem.com/api/webhooks/stripe` (live mode, active)
  - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

### GitHub
- **Repo:** https://github.com/jackdamnielzz/tribemem.git
- **Branch:** `master`
- **Connected to Vercel:** Auto-deploy on push

---

## 4. Completed Priorities

### ✅ Priority 1 — Worker Deployment
- Worker deployed on **Railway** with Docker
- Health check endpoint at `/health` returns worker status and Redis connectivity
- `.dockerignore` added for faster builds
- All 6 workers running: crawl, extract, synthesize, alert, billing, digest

### ✅ Priority 2 — Auth Pages & Flows
- `/forgot-password` — password reset request page (sends email via Supabase)
- `/reset-password` — set new password page (with confirmation field)
- `/onboarding` — post-signup org creation flow (name, slug, description)
- `/terms` — Terms of Service page (11 sections)
- `/privacy` — Privacy Policy page (11 sections)
- Dashboard layout redirects users without an org to `/onboarding`
- Middleware updated to allow unauthenticated access to auth pages

### ✅ Priority 3 — Billing Completion
- **Billing UI** (`/settings/billing`) — fully dynamic with real usage data, plan info, subscription status
- **Plan upgrade/downgrade/cancel** — working buttons calling Stripe API
- **Billing history** — shows events from `billing_events` table
- **Usage tracking** — `increment_usage` RPC function for atomic JSONB counter increments
- **Usage reset job** — hourly BullMQ cron resets expired usage periods (30-day cycle)
- **Grace period** — hourly check auto-downgrades orgs 7 days after payment failure
- **Fixed bugs:** Wrong table references (`org_members` → `members`, `org_id` → `organization_id`), deep imports to avoid `node:crypto` webpack error

### ✅ Priority 4 — Connector OAuth
- **OAuth flow fully implemented** — `providers.ts` (8 providers), callback handler, token exchange, AES-256-GCM credential encryption
- **Fixed bugs:** Wrong table references in OAuth routes (`org_members` → `members`)
- **DB migration 00019:** Added missing connector types (intercom, hubspot, stripe, zendesk, freshdesk) and columns (credentials_encrypted, display_name, created_by)
- **Dynamic connectors UI** — real data from DB, working Connect buttons that trigger OAuth flow
- **Connector cards** show "Coming soon" for connectors without OAuth providers

**Still needed:** Create OAuth apps on each platform and set env vars (see Section 5 below)

### ✅ Priority 5 — Email & E2E Tests
- **Resend integration** — lazy-loaded client (gracefully skips when `RESEND_API_KEY` not set)
- **Welcome email** — sent on org creation via `/api/internal/email`
- **Alert emails** — worker sends real emails to org owner on alert creation
- **Weekly digest** — BullMQ scheduled job (Mondays 9am UTC), sends activity summary to org owners
- **E2E test auth** — Playwright global setup script that logs in and saves storage state
- **43 E2E tests** across 4 spec files (home, auth, pricing, dashboard)

---

## 5. What Still Needs To Be Done

### Completed (Session 2026-03-23)
- ✅ **GitHub OAuth** — app created, env vars set on Vercel + Railway
- ✅ **Slack OAuth** — app created, env vars set on Vercel + Railway
- ✅ **Notion OAuth** — public integration created, env vars set on Vercel + Railway
- ✅ **Google Drive OAuth** — app created in Google Cloud Console, env vars set on Vercel + Railway
- ✅ **Resend Email** — API key set on Vercel + Railway
- ✅ **Stripe Live Mode** — products created in USD, all env vars updated to live mode

### Remaining Connector OAuth Apps

| Connector | Platform | Env Vars |
|-----------|----------|----------|
| Jira | https://developer.atlassian.com/console/myapps | `JIRA_CLIENT_ID`, `JIRA_CLIENT_SECRET` |
| Linear | https://linear.app/settings/api | `LINEAR_CLIENT_ID`, `LINEAR_CLIENT_SECRET` |
| Intercom | https://app.intercom.com/a/apps/_/developer-hub | `INTERCOM_CLIENT_ID`, `INTERCOM_CLIENT_SECRET` |
| HubSpot | https://app.hubspot.com/developer | `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET` |

### Optional Enhancements

- **Google/GitHub OAuth login** — enable in Supabase Dashboard → Sign In / Providers
- **SSO/SAML** — planned for enterprise tier per `plan.md`
- **CI/CD pipeline** — GitHub Actions for automated testing on PRs
- **More E2E tests** — add authenticated flow tests (login, connector setup, billing)
- **Google Drive API** — enable the Drive API in Google Cloud Console (APIs & Services → Library)

---

## 6. Key Technical Decisions & Fixes Applied

### Original Fixes (previous sessions)
1. **Turbo v2:** `pipeline` renamed to `tasks` in `turbo.json`
2. **pgvector on Supabase:** Extension lives in `extensions` schema — columns must use `extensions.vector(1536)` type
3. **Vector index:** Using HNSW instead of ivfflat (works on empty tables)
4. **Stripe SDK:** API version pinned to `2023-10-16` (matching installed `stripe@^14.0.0`)
5. **slugify types:** Using `Parameters<typeof slugify>[1]` instead of `slugify.Options` (not exported)
6. **Middleware:** Gracefully skips auth when Supabase env vars are missing (dev mode safe)
7. **Next.js:** Removed deprecated `experimental.serverActions` config
8. **@radix-ui/react-badge:** Removed (doesn't exist on npm), Badge is a custom component

### Fixes Applied Session 2026-03-21
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

### Changes Applied Session 2026-03-22
19. **Custom domain:** Connected `tribemem.com` (+ `www.tribemem.com`) to Vercel via Namecheap DNS A records → `76.76.21.21`
20. **Supabase Auth configured:** Email provider enabled, Site URL set to `https://tribemem.com`, redirect URLs added
21. **Stripe products created (test mode):** TribeMem Starter (€49/mo), Growth (€149/mo), Business (€399/mo) — all with EUR pricing
22. **Stripe webhook endpoint:** Created and verified, signing secret working
23. **Stripe webhook handler rewritten:** Signature verification via `stripe.webhooks.constructEvent()`, all 5 event handlers with real DB updates
24. **Stripe price ID mapping added:** `stripe_price_id_monthly/yearly` fields in `Plan` interface, `getPlanByStripePriceId()` helper
25. **Vercel env vars:** Set all Stripe price IDs, webhook secret, app URL
26. **Auth pages:** Created forgot-password, reset-password, onboarding, terms, privacy pages
27. **Dashboard layout:** Org membership check with redirect to `/onboarding`
28. **Billing UI:** Replaced hardcoded demo data with dynamic API data, working upgrade/downgrade/cancel
29. **Billing API fixes:** Fixed table references (`org_members` → `members`, `org_id` → `organization_id`)
30. **Usage tracking:** Created `increment_usage` RPC function (migration 00018), billing worker with usage reset + grace period
31. **Connector OAuth fixes:** Fixed table references in OAuth routes, expanded connector types (migration 00019)
32. **Connectors UI:** Replaced mock data with real DB queries, working OAuth Connect buttons
33. **Resend emails:** Lazy-loaded client, welcome email on org creation, alert emails in worker, weekly digest job
34. **E2E test auth:** Playwright global setup for automated login and storage state persistence
35. **Deep imports:** Use `@tribemem/shared/src/constants/plans` instead of barrel `@tribemem/shared` to avoid `node:crypto` webpack error in client components

---

## 7. File Reference

### Key Config Files
- `plan.md` — Full platform specification (single source of truth)
- `turbo.json` — Turborepo task config
- `pnpm-workspace.yaml` — Workspace definition
- `.env.example` — All environment variables documented
- `railway.json` — Railway deployment config

### Key Source Files
- `apps/web/middleware.ts` — Auth middleware with dev-mode bypass
- `apps/web/app/api/billing/route.ts` — Stripe billing endpoints (GET/POST/PUT/DELETE)
- `apps/web/app/api/webhooks/stripe/route.ts` — Stripe webhook handler (5 event types)
- `apps/web/app/api/auth/connectors/callback/route.ts` — OAuth callback handler
- `apps/web/app/api/v1/connectors/[type]/connect/route.ts` — OAuth initiation
- `apps/web/app/api/internal/email/route.ts` — Email sending endpoint
- `apps/web/lib/oauth/providers.ts` — OAuth configs for all 8 connectors
- `apps/web/lib/oauth/encryption.ts` — AES-256-GCM token encryption
- `apps/web/lib/email/` — Resend email integration (3 files: resend.ts, send.ts, templates.ts)
- `apps/worker/src/index.ts` — Worker entry point (6 workers)
- `apps/worker/src/connectors/` — 10 connector implementations
- `apps/worker/src/extraction/` — LLM extraction pipeline
- `apps/worker/src/queues/` — BullMQ queue definitions (crawl, sync, extract)
- `apps/worker/src/processors/` — Job processors (synthesize, alert, billing, digest)
- `apps/worker/src/lib/redis.ts` — Redis connection management
- `apps/worker/src/lib/email.ts` — Worker email helper (Resend)
- `packages/mcp-server/src/` — MCP server with 4 tools
- `packages/shared/src/types/connector.ts` — RawEvent, Connector, ConnectorType types

### Auth Pages
- `apps/web/app/(auth)/login/page.tsx` — Login
- `apps/web/app/(auth)/signup/page.tsx` — Signup
- `apps/web/app/(auth)/forgot-password/page.tsx` — Password reset request
- `apps/web/app/(auth)/reset-password/page.tsx` — Set new password
- `apps/web/app/(auth)/onboarding/page.tsx` — Org creation flow

### Documentation
- `docs/architecture.md` — System architecture overview
- `docs/api-reference.md` — API endpoint documentation
- `docs/connector-guide.md` — How to add/configure connectors
- `docs/extraction-pipeline.md` — Extraction engine details
- `docs/deployment.md` — Deployment guide
- `docs/mcp-setup.md` — MCP server setup
- `docs/sdk-guide.md` — SDK usage guide

---

## 8. Quick Start for New Chat

```bash
# To continue development:
cd d:\Programmeren\tribemem
pnpm install
pnpm dev          # starts Next.js on localhost:3000

# To build:
pnpm build        # builds all 5 packages

# To run tests:
pnpm test         # 177 Vitest unit tests across 4 packages

# To run E2E tests (requires running app):
cd apps/web
E2E_USER_EMAIL=test@example.com E2E_USER_PASSWORD=xxx pnpm exec playwright test

# To push migrations:
npx supabase db push

# To deploy:
git add . && git commit -m "..." && git push origin master
# Vercel auto-deploys on push; Railway auto-deploys from Dockerfile
```

**Supabase CLI is already logged in and linked to the project.**

### Next Steps for New Session
1. Create OAuth apps for connectors (Slack, Notion, GitHub, etc.) and set env vars
2. Set up Resend: verify domain, set `RESEND_API_KEY` on Vercel + Railway
3. Go live on Stripe: create live mode products/prices, update env vars
4. Optional: Google/GitHub OAuth login, CI/CD pipeline, more E2E tests
