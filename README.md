# TribeMem

**Your team's knowledge, always current. Never ask the same question twice.**

TribeMem is an autonomous crawler agent platform for organizational knowledge. It continuously monitors your team's communication and documentation tools, extracts actionable knowledge, and serves it through a unified query interface, an MCP server for AI-native workflows, and a TypeScript SDK.

---

## Key Features

- **Auto-crawling** -- Connects to Slack, Notion, Jira, GitHub, Intercom, Linear, Google Drive, HubSpot, Stripe, and more. The crawler agent discovers and ingests knowledge autonomously.
- **Knowledge graph** -- Entities (people, teams, systems, projects) and their relationships are extracted automatically and kept up to date.
- **Temporal versioning** -- Every knowledge unit carries a full version history with change types, timestamps, and supersession chains so you can see how knowledge evolves.
- **Source-linked answers** -- Every answer cites the original messages, pages, or tickets it was synthesized from, with confidence scores and freshness indicators.
- **Contradiction & drift detection** -- Alerts surface when newly extracted knowledge contradicts existing facts or when processes drift from documented norms.
- **MCP server for AI tools** -- Expose your organization's knowledge to Claude Desktop, Claude Code, Cursor, and any MCP-compatible AI tool.
- **TypeScript SDK** -- Integrate TribeMem into your own applications with a fully typed client library.
- **Multi-tenancy** -- Organization-scoped data with row-level security, role-based access, and per-plan quotas.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| Backend / API | Next.js API Routes |
| Database | Supabase (PostgreSQL + pgvector, optional Apache AGE) |
| Queue | BullMQ + Redis |
| AI | Anthropic Claude (Haiku for extraction, Sonnet for synthesis) |
| Auth | Supabase Auth |
| Payments | Stripe |
| Monorepo | pnpm workspaces + Turborepo |

---

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9.15
- Docker (for local Supabase and Redis)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/your-org/tribemem.git
cd tribemem

# Install dependencies
pnpm install

# Copy environment template and fill in values
cp .env.example .env.local

# Start Supabase locally (requires Docker)
npx supabase start

# Run database migrations
npx supabase db push

# Start Redis (via Docker)
docker run -d --name tribemem-redis -p 6379:6379 redis:7-alpine

# Start all services in development mode
pnpm dev
```

The web app will be available at `http://localhost:3000`.

---

## Project Structure

```
tribemem/
├── apps/
│   ├── web/                    # Next.js 14 frontend + API routes
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, signup, OAuth callback
│   │   │   ├── (dashboard)/    # Dashboard pages (ask, knowledge, connectors, etc.)
│   │   │   ├── (marketing)/    # Public pages (pricing)
│   │   │   └── api/v1/         # REST API endpoints
│   │   ├── components/         # React components (ui, layout, knowledge, chat, etc.)
│   │   ├── hooks/              # React hooks
│   │   └── lib/                # Utilities, Supabase client, API helpers
│   └── worker/                 # BullMQ worker service
│       └── src/
│           ├── connectors/     # Connector implementations (Slack, Notion, etc.)
│           ├── extraction/     # LLM extraction pipeline + prompts
│           ├── lib/            # Redis client, shared utilities
│           ├── memory/         # Knowledge storage and retrieval
│           ├── processors/     # Queue job processors
│           └── queues/         # Queue definitions
├── packages/
│   ├── shared/                 # Shared types, constants, validators, utilities
│   │   └── src/
│   │       ├── constants/      # Connector metadata, plans, rate limits
│   │       ├── types/          # TypeScript type definitions
│   │       ├── utils/          # Shared utility functions
│   │       └── validators/     # Zod schemas and validation
│   ├── sdk/                    # @tribemem/sdk -- TypeScript client library
│   └── mcp-server/             # @tribemem/mcp-server -- MCP server for AI tools
├── supabase/
│   └── migrations/             # Database migrations
├── turbo.json                  # Turborepo pipeline configuration
├── pnpm-workspace.yaml         # pnpm workspace definition
└── tsconfig.base.json          # Shared TypeScript configuration
```

---

## Available Scripts

Run from the repository root:

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps and packages in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all packages |
| `pnpm type-check` | Type-check all packages |
| `pnpm test` | Run tests across all packages |
| `pnpm format` | Format all files with Prettier |

---

## Environment Variables

Create a `.env.local` file in the repository root (or in `apps/web/` and `apps/worker/` individually):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-...

# Stripe (billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000/api

# OAuth (per connector -- see docs/connector-guide.md)
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
# ... additional connector credentials as needed
```

See [docs/deployment.md](docs/deployment.md) for production environment configuration.

---

## Deployment

| Component | Platform |
|-----------|----------|
| Web app + API | Vercel |
| Worker service | Railway |
| Database | Supabase (hosted) |
| Queue / Cache | Railway Redis or Upstash |

For detailed deployment instructions, see [docs/deployment.md](docs/deployment.md).

---

## Documentation

- [Architecture](docs/architecture.md) -- System design and data flow
- [API Reference](docs/api-reference.md) -- REST API endpoints and schemas
- [Connector Guide](docs/connector-guide.md) -- Building and configuring connectors
- [Extraction Pipeline](docs/extraction-pipeline.md) -- How knowledge is extracted from raw events
- [Deployment Guide](docs/deployment.md) -- Production deployment walkthrough
- [MCP Server Setup](docs/mcp-setup.md) -- Exposing knowledge to AI tools via MCP
- [SDK Guide](docs/sdk-guide.md) -- Using the TypeScript SDK

---

## License

MIT
