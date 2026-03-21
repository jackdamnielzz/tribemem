# Connector Development Guide

This guide explains how TribeMem connectors work and how to build a new one.

---

## Overview

A connector is a module that bridges a third-party service (Slack, Notion, Jira, etc.) with the TribeMem extraction pipeline. Each connector is responsible for:

1. **Authentication** -- Handling OAuth flows or API key storage.
2. **Discovery** -- Listing available resources (channels, pages, repositories).
3. **Fetching** -- Polling for new events since the last sync cursor, or receiving webhook payloads.
4. **Normalization** -- Converting API-specific payloads into the standard `RawEvent` format.

The worker service orchestrates connectors through BullMQ jobs, calling the appropriate connector for each sync or webhook job.

---

## Available Connectors

| Connector | Category | Auth Method | Event Sources |
|-----------|----------|-------------|---------------|
| **Slack** | Communication | OAuth 2.0 | Channel messages, threads, reactions |
| **Microsoft Teams** | Communication | OAuth 2.0 | Channel messages, chats |
| **Notion** | Documentation | OAuth 2.0 | Pages, database entries, comments |
| **Confluence** | Documentation | OAuth 2.0 | Spaces, pages, comments |
| **Jira** | Project Management | OAuth 2.0 | Issues, comments, status changes |
| **Linear** | Project Management | OAuth 2.0 | Issues, comments, project updates |
| **GitHub** | Project Management | OAuth 2.0 | Issues, PRs, discussions, reviews |
| **GitLab** | Project Management | OAuth 2.0 | Issues, merge requests, wikis |
| **Intercom** | Support | OAuth 2.0 | Conversations, articles |
| **Zendesk** | Support | OAuth 2.0 | Tickets, help center articles |
| **Freshdesk** | Support | API Key | Tickets, solutions |
| **Google Drive** | Storage | OAuth 2.0 | Docs, Sheets, Slides |
| **HubSpot** | CRM | OAuth 2.0 | Contacts, companies, deals, notes |
| **Stripe** | Other | API Key | Events, customers, subscriptions |

---

## BaseConnector Interface

Every connector extends the `BaseConnector` abstract class:

```typescript
import type { ConnectorType, RawEvent, SyncCursor, ConnectorConfig } from '@tribemem/shared';

export abstract class BaseConnector {
  abstract readonly type: ConnectorType;

  /**
   * Return the OAuth authorization URL for the user to grant access.
   * Not needed for API-key-based connectors.
   */
  abstract getAuthUrl(redirectUri: string, state: string): string;

  /**
   * Exchange an OAuth authorization code for access/refresh tokens.
   */
  abstract exchangeCode(code: string, redirectUri: string): Promise<TokenSet>;

  /**
   * Refresh an expired OAuth access token.
   */
  abstract refreshToken(refreshToken: string): Promise<TokenSet>;

  /**
   * Discover available resources (e.g., Slack channels, Notion databases).
   * Used to let the user select which resources to sync.
   */
  abstract discoverResources(credentials: TokenSet): Promise<Resource[]>;

  /**
   * Fetch new events since the last sync cursor.
   * Returns normalized RawEvents and an updated cursor.
   */
  abstract fetchEvents(
    credentials: TokenSet,
    config: ConnectorConfig,
    cursor: SyncCursor | null,
  ): Promise<FetchResult>;

  /**
   * Parse an incoming webhook payload into RawEvents.
   * Only needed for connectors that support push-based sync.
   */
  abstract parseWebhook(
    payload: unknown,
    headers: Record<string, string>,
    secret: string,
  ): Promise<RawEvent[]>;
}

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  scope?: string;
}

export interface Resource {
  external_id: string;
  name: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export interface FetchResult {
  events: RawEvent[];
  cursor: SyncCursor;
  has_more: boolean;
}
```

---

## Step-by-Step: Building a New Connector

### 1. Register the connector type

Add the new type to `packages/shared/src/types/connector.ts`:

```typescript
export type ConnectorType =
  | 'slack'
  | 'notion'
  // ...existing types...
  | 'your_service';
```

Add metadata in `packages/shared/src/constants/connectors.ts`:

```typescript
your_service: {
  type: 'your_service',
  name: 'Your Service',
  description: 'Import knowledge from Your Service',
  logoPlaceholder: '/connectors/your_service.svg',
  category: 'communication',
  requiredScopes: ['read:messages'],
  optionalScopes: ['read:files'],
  authMethod: 'oauth2',
  docsUrl: 'https://docs.yourservice.com/oauth',
},
```

### 2. Create the connector class

Create `apps/worker/src/connectors/your-service.ts`:

```typescript
import { BaseConnector, type TokenSet, type Resource, type FetchResult } from './base';
import type { ConnectorConfig, RawEvent, SyncCursor } from '@tribemem/shared';

export class YourServiceConnector extends BaseConnector {
  readonly type = 'your_service' as const;

  getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: process.env.YOUR_SERVICE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
      scope: 'read:messages read:files',
    });
    return `https://yourservice.com/oauth/authorize?${params}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const response = await fetch('https://yourservice.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.YOUR_SERVICE_CLIENT_ID,
        client_secret: process.env.YOUR_SERVICE_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenSet> {
    // Similar to exchangeCode but with grant_type: 'refresh_token'
  }

  async discoverResources(credentials: TokenSet): Promise<Resource[]> {
    const response = await fetch('https://api.yourservice.com/channels', {
      headers: { Authorization: `Bearer ${credentials.access_token}` },
    });
    const data = await response.json();
    return data.channels.map((ch: any) => ({
      external_id: ch.id,
      name: ch.name,
      type: 'channel',
    }));
  }

  async fetchEvents(
    credentials: TokenSet,
    config: ConnectorConfig,
    cursor: SyncCursor | null,
  ): Promise<FetchResult> {
    const since = cursor?.cursor_value || '1970-01-01T00:00:00Z';

    const response = await fetch(
      `https://api.yourservice.com/messages?since=${since}`,
      { headers: { Authorization: `Bearer ${credentials.access_token}` } },
    );
    const data = await response.json();

    const events: RawEvent[] = data.messages.map((msg: any) => ({
      id: crypto.randomUUID(),
      org_id: '',  // filled by the processor
      connector_id: '',  // filled by the processor
      connector_type: 'your_service',
      external_id: msg.id,
      event_type: 'message',
      author_external_id: msg.author_id,
      author_name: msg.author_name,
      content: msg.text,
      raw_payload: msg,
      occurred_at: msg.created_at,
      ingested_at: new Date().toISOString(),
      processed: false,
      processed_at: null,
    }));

    return {
      events,
      cursor: {
        id: cursor?.id || crypto.randomUUID(),
        connector_id: '',
        cursor_type: 'timestamp',
        cursor_value: data.messages.at(-1)?.created_at || since,
        metadata: {},
        updated_at: new Date().toISOString(),
      },
      has_more: data.has_more,
    };
  }

  async parseWebhook(
    payload: unknown,
    headers: Record<string, string>,
    secret: string,
  ): Promise<RawEvent[]> {
    // Verify webhook signature, parse payload, return RawEvents
    return [];
  }
}
```

### 3. Register the connector

Add your connector to the connector registry so the worker can instantiate it:

```typescript
// apps/worker/src/connectors/index.ts
import { YourServiceConnector } from './your-service';

export const CONNECTORS = {
  // ...existing connectors...
  your_service: new YourServiceConnector(),
};
```

### 4. Add environment variables

Add the required OAuth credentials to `.env.local`:

```bash
YOUR_SERVICE_CLIENT_ID=...
YOUR_SERVICE_CLIENT_SECRET=...
```

### 5. Test

Run a manual sync using the dashboard or the API:

```bash
curl -X POST https://api.tribemem.ai/v1/crawler \
  -H "Authorization: Bearer tm_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"connector_id": "conn_xxx", "full_sync": true}'
```

---

## OAuth Flow

For OAuth-based connectors, the flow works as follows:

```
User clicks "Connect" in dashboard
         │
         ▼
Frontend calls POST /v1/connectors
  → creates connector with status "pending"
  → returns oauth_url
         │
         ▼
User is redirected to third-party OAuth consent screen
         │
         ▼
User grants access, redirected back to /callback?code=xxx&state=yyy
         │
         ▼
Callback handler calls connector.exchangeCode(code)
  → stores encrypted tokens in connector.credentials_encrypted
  → updates connector status to "connected"
         │
         ▼
Worker picks up initial sync job
  → connector.discoverResources() shows available resources
  → connector.fetchEvents() begins ingesting data
  → status moves to "active"
```

Tokens are encrypted at rest using AES-256-GCM with a server-side encryption key. The refresh token flow runs automatically before each sync when the access token is close to expiry.

---

## RawEvent Format

Every connector must produce events conforming to the `RawEvent` interface:

```typescript
interface RawEvent {
  id: string;                          // UUID, generated at ingestion
  org_id: string;                      // Organization ID (set by processor)
  connector_id: string;                // Connector ID (set by processor)
  connector_type: ConnectorType;       // e.g., 'slack', 'notion'
  external_id: string;                 // ID from the third-party system
  event_type: string;                  // e.g., 'message', 'page_update', 'issue_comment'
  author_external_id: string | null;   // Author's ID in the third-party system
  author_name: string | null;          // Author's display name
  content: string;                     // Plain-text content for extraction
  raw_payload: Record<string, unknown>;// Full API response for reference
  occurred_at: string;                 // When the event happened (ISO 8601)
  ingested_at: string;                 // When TribeMem ingested it (ISO 8601)
  processed: boolean;                  // Whether extraction has run
  processed_at: string | null;         // When extraction completed
}
```

Guidelines for the `content` field:
- Strip HTML/Markdown formatting to plain text where possible.
- Include enough context for the LLM to extract meaningful knowledge (e.g., include the parent message in a thread reply).
- Truncate content that exceeds 1 MB (`MAX_EVENT_PAYLOAD_BYTES`).

---

## Rate Limiting Best Practices

Third-party APIs impose their own rate limits. Follow these practices to avoid disruption:

1. **Respect Retry-After headers.** If the API returns `429 Too Many Requests`, read the `Retry-After` header and wait before retrying.
2. **Use exponential backoff.** Start with a 1-second delay and double it on each consecutive failure, up to a maximum of 60 seconds.
3. **Page with cursors, not offsets.** Most APIs provide cursor-based pagination that is more efficient and avoids skipping or duplicating items.
4. **Batch requests where possible.** Prefer endpoints that return multiple items per request (e.g., Slack's `conversations.history` returns up to 1,000 messages).
5. **Track rate limit usage.** Store the remaining quota from response headers and slow down proactively when approaching the limit.
6. **Store the sync cursor atomically.** Always update the cursor in the same database transaction as the ingested events to avoid re-processing or data loss on failure.
