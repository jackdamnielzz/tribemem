# Deployment Guide

This guide walks through deploying TribeMem to production using Vercel (web app), Railway (worker), and Supabase (database).

---

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9.15
- **Docker** (for local development)
- **Accounts:** Vercel, Railway, Supabase, Stripe, Anthropic

---

## 1. Supabase Project Setup

### Create a Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Choose a strong database password and save it securely.
3. Select a region close to your users.

### Enable Extensions

In the Supabase SQL Editor, run:

```sql
-- Enable vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable Apache AGE for graph queries (optional)
CREATE EXTENSION IF NOT EXISTS age;
```

### Run Migrations

From your local machine:

```bash
# Link to your Supabase project
npx supabase link --project-ref your-project-ref

# Push all migrations
npx supabase db push
```

### Configure Auth

In the Supabase dashboard:

1. Go to **Authentication > Providers** and enable Email.
2. Set the **Site URL** to your production domain (e.g., `https://app.tribemem.ai`).
3. Add redirect URLs: `https://app.tribemem.ai/callback`.
4. (Optional) Enable OAuth providers (Google, GitHub) for social login.

### Collect Credentials

From the Supabase dashboard **Settings > API**, note:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Redis Setup

TribeMem requires Redis for BullMQ job queues.

### Option A: Railway Redis

1. In your Railway project, click **New Service > Database > Redis**.
2. Copy the `REDIS_URL` from the service variables.

### Option B: Upstash

1. Create a Redis database at [upstash.com](https://upstash.com).
2. Copy the `REDIS_URL` (use the `rediss://` TLS URL in production).

### Option C: Self-Hosted

Run Redis on any server:

```bash
docker run -d \
  --name tribemem-redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7-alpine \
  redis-server --appendonly yes --requirepass your-redis-password
```

Set `REDIS_URL=redis://:your-redis-password@your-server:6379`.

---

## 3. Stripe Configuration

### Create Products and Prices

1. In the Stripe dashboard, create products for each plan: Free, Starter, Growth, Business, Enterprise.
2. For each product, create monthly and yearly prices matching the amounts in `packages/shared/src/constants/plans.ts`.
3. Note the price IDs (e.g., `price_xxx`).

### Set Up Webhooks

1. In the Stripe dashboard, go to **Developers > Webhooks**.
2. Add an endpoint: `https://app.tribemem.ai/api/webhooks/stripe`.
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret (`whsec_xxx`).

---

## 4. Vercel Deployment (Web App)

### Connect Repository

1. Go to [vercel.com](https://vercel.com) and import your GitHub repository.
2. Set the **Root Directory** to `apps/web`.
3. Set the **Framework Preset** to Next.js.
4. Set the **Build Command** to `cd ../.. && pnpm install && pnpm turbo build --filter=web`.
5. Set the **Install Command** to `pnpm install`.

### Environment Variables

Add the following environment variables in the Vercel project settings:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# App
NEXT_PUBLIC_APP_URL=https://app.tribemem.ai
API_BASE_URL=https://app.tribemem.ai/api

# Redis (needed for API routes that enqueue jobs)
REDIS_URL=redis://...

# OAuth credentials (per connector)
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
NOTION_CLIENT_ID=...
NOTION_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
# Add remaining connector credentials as needed
```

### Deploy

Push to your main branch. Vercel will build and deploy automatically.

---

## 5. Railway Deployment (Worker)

### Create a Service

1. Go to [railway.app](https://railway.app) and create a new project.
2. Click **New Service > GitHub Repo** and select your repository.
3. Set the **Root Directory** to `apps/worker`.
4. Set the **Build Command** to `cd ../.. && pnpm install && pnpm turbo build --filter=worker`.
5. Set the **Start Command** to `node dist/index.js`.

### Environment Variables

Add the same database and service credentials:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Redis
REDIS_URL=redis://...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# OAuth credentials (same as Vercel)
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
# ... etc.
```

### Deploy

Railway will build and deploy automatically on push. The worker runs as a long-lived process (not serverless).

### Health Check

Configure a health check endpoint if your worker exposes one:

- **Path:** `/health`
- **Interval:** 30 seconds
- **Timeout:** 5 seconds

---

## 6. DNS and Domain Setup

### Custom Domain

1. In Vercel, go to **Project Settings > Domains**.
2. Add your domain (e.g., `app.tribemem.ai`).
3. Add the DNS records Vercel provides (CNAME or A record) to your domain registrar.

### API Domain (Optional)

If you want a separate API domain (e.g., `api.tribemem.ai`):

1. Add the domain in Vercel.
2. Configure a rewrite rule in `next.config.js` or use Vercel's path-based routing.

---

## 7. CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm type-check

      - run: pnpm lint

      - run: pnpm test

  deploy-web:
    needs: check
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: --prod

  migrate-db:
    needs: check
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### Required Secrets

Add these to your GitHub repository settings under **Settings > Secrets and variables > Actions**:

| Secret | Source |
|--------|--------|
| `VERCEL_TOKEN` | Vercel account settings |
| `VERCEL_ORG_ID` | Vercel project settings |
| `VERCEL_PROJECT_ID` | Vercel project settings |
| `SUPABASE_ACCESS_TOKEN` | Supabase account settings |
| `SUPABASE_PROJECT_REF` | Supabase project URL |

---

## 8. Monitoring and Health Checks

### Application Monitoring

- **Vercel Analytics** -- Enable in Vercel project settings for web vitals and function execution metrics.
- **Vercel Logs** -- View real-time and historical logs for API routes.

### Worker Monitoring

- **Railway Logs** -- View real-time logs for the worker service.
- **BullMQ Dashboard** -- Consider deploying [Bull Board](https://github.com/felixmosh/bull-board) as a separate service to monitor queue health, failed jobs, and throughput.

### Key Metrics to Monitor

| Metric | Threshold | Alert |
|--------|-----------|-------|
| API response time (p95) | > 2,000 ms | Warning |
| API error rate | > 1% | Critical |
| Worker queue depth | > 1,000 jobs | Warning |
| Failed job count | > 10 in 1 hour | Critical |
| Connector sync errors | > 3 consecutive | High |
| Database connections | > 80% pool | Warning |
| Redis memory usage | > 80% | Warning |

### Uptime Monitoring

Use a service like [UptimeRobot](https://uptimerobot.com) or [Better Uptime](https://betteruptime.com) to monitor:

- `https://app.tribemem.ai` -- Web app availability
- `https://app.tribemem.ai/api/v1/health` -- API health endpoint

---

## Environment Variable Reference (Production)

```bash
# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# === Redis ===
REDIS_URL=rediss://default:password@host:6379

# === Anthropic ===
ANTHROPIC_API_KEY=sk-ant-api03-...

# === Stripe ===
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# === App ===
NEXT_PUBLIC_APP_URL=https://app.tribemem.ai
API_BASE_URL=https://app.tribemem.ai/api

# === Connector OAuth (add as needed) ===
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
JIRA_CLIENT_ID=
JIRA_CLIENT_SECRET=
LINEAR_CLIENT_ID=
LINEAR_CLIENT_SECRET=
INTERCOM_CLIENT_ID=
INTERCOM_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=
```
