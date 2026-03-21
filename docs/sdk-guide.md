# SDK Usage Guide

The `@tribemem/sdk` package provides a fully typed TypeScript client for the TribeMem API.

---

## Installation

```bash
npm install @tribemem/sdk
# or
pnpm add @tribemem/sdk
# or
yarn add @tribemem/sdk
```

---

## Quick Start

```typescript
import { TribeMemClient } from '@tribemem/sdk';

const client = new TribeMemClient({
  apiKey: 'tm_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
});

// Ask a question
const result = await client.query('What is our deployment process?');

console.log(result.answer);
console.log(`Confidence: ${result.confidence}`);
console.log(`Sources: ${result.sources.length}`);
```

---

## Client Initialization

```typescript
import { TribeMemClient } from '@tribemem/sdk';

const client = new TribeMemClient({
  // Required: your API key
  apiKey: 'tm_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',

  // Optional: override the base URL (default: https://api.tribemem.ai/v1)
  baseUrl: 'https://api.tribemem.ai/v1',

  // Optional: request timeout in milliseconds (default: 30000)
  timeout: 30000,

  // Optional: custom fetch implementation
  fetch: globalThis.fetch,
});
```

---

## Querying Knowledge

### Basic Query

```typescript
const result = await client.query('How do we handle production incidents?');

console.log(result.answer);
// "Production incidents follow a 5-step process: ..."

console.log(result.confidence);
// 0.92

for (const source of result.sources) {
  console.log(`- ${source.title} (relevance: ${source.relevance_score})`);
}
```

### Filtered Query

```typescript
const result = await client.query('What tools does the backend team use?', {
  filters: {
    categories: ['engineering'],
    types: ['fact', 'definition'],
    min_confidence: 0.7,
    date_from: '2025-01-01',
    connector_types: ['slack', 'notion'],
  },
  max_results: 5,
  include_related: true,
});

// Related follow-up questions
for (const question of result.related_questions) {
  console.log(`Related: ${question}`);
}

// Performance metadata
console.log(`Retrieval: ${result.metadata.retrieval_time_ms}ms`);
console.log(`Synthesis: ${result.metadata.synthesis_time_ms}ms`);
console.log(`Tokens used: ${result.metadata.tokens_used}`);
```

---

## Listing and Browsing Knowledge

### List Knowledge Units

```typescript
const { data, pagination } = await client.knowledge.list({
  type: 'process',
  category: 'engineering',
  status: 'active',
  search: 'deployment',
  min_confidence: 0.6,
  limit: 20,
  offset: 0,
});

for (const unit of data) {
  console.log(`[${unit.type}] ${unit.title} (confidence: ${unit.confidence_score})`);
}

console.log(`Total: ${pagination.total}, Has more: ${pagination.has_more}`);
```

### Get a Single Knowledge Unit

```typescript
const unit = await client.knowledge.get('ku_abc123');

console.log(unit.title);
console.log(unit.content);
console.log(`Status: ${unit.status}`);
console.log(`Evidence count: ${unit.evidence_count}`);
console.log(`Tags: ${unit.tags.join(', ')}`);
```

### Get Version History

```typescript
const { data: versions } = await client.knowledge.history('ku_abc123');

for (const version of versions) {
  console.log(`v${version.version_number} - ${version.change_type}`);
  if (version.change_reason) {
    console.log(`  Reason: ${version.change_reason}`);
  }
  if (version.new_content) {
    console.log(`  New content: ${version.new_content.substring(0, 100)}...`);
  }
}
```

---

## Entity Operations

### List Entities

```typescript
const { data: entities } = await client.entities.list({
  type: 'system',
  search: 'payment',
  limit: 10,
});

for (const entity of entities) {
  console.log(`${entity.name} (${entity.type}) - ${entity.mention_count} mentions`);
  if (entity.aliases.length > 0) {
    console.log(`  Aliases: ${entity.aliases.join(', ')}`);
  }
}
```

### Get Entity Relations

```typescript
const { data: relations } = await client.entities.relations('ent_xyz789');

for (const rel of relations) {
  console.log(
    `${rel.source_entity_id} --[${rel.relation_type}]--> ${rel.target_entity_id}` +
    ` (confidence: ${rel.confidence})`
  );
}
```

---

## Connector Management

### List Connectors

```typescript
const { data: connectors } = await client.connectors.list();

for (const conn of connectors) {
  console.log(`${conn.display_name} (${conn.type}) - ${conn.status}`);
  console.log(`  Events processed: ${conn.events_processed}`);
  console.log(`  Last sync: ${conn.last_sync_at}`);
}
```

### Create a Connector

```typescript
const result = await client.connectors.create({
  type: 'slack',
  display_name: 'Engineering Slack',
  settings: {
    selected_channels: ['#engineering', '#incidents'],
  },
});

if (result.oauth_url) {
  // Redirect the user to this URL to complete OAuth
  console.log(`Authorize at: ${result.oauth_url}`);
}
```

### Update a Connector

```typescript
await client.connectors.update('conn_001', {
  display_name: 'Updated Name',
  settings: {
    selected_channels: ['#engineering', '#incidents', '#product'],
  },
});
```

### Delete a Connector

```typescript
await client.connectors.delete('conn_001', { delete_events: true });
```

### Trigger a Crawler Run

```typescript
const run = await client.crawler.trigger({
  connector_id: 'conn_001',
  full_sync: false,
});

console.log(`Crawler run started: ${run.id} (status: ${run.status})`);
```

### List Crawler Runs

```typescript
const { data: runs } = await client.crawler.list({
  connector_id: 'conn_001',
  status: 'completed',
  limit: 5,
});

for (const run of runs) {
  console.log(
    `${run.id}: ${run.events_ingested} events, ` +
    `${run.knowledge_units_created} created, ` +
    `${run.knowledge_units_updated} updated`
  );
}
```

---

## Alerts

### List Alerts

```typescript
const { data: alerts } = await client.alerts.list({
  type: 'contradiction',
  status: 'open',
  severity: 'high',
});

for (const alert of alerts) {
  console.log(`[${alert.severity}] ${alert.title}`);
  console.log(`  ${alert.description}`);
}
```

### Update an Alert

```typescript
await client.alerts.update('alert_001', {
  status: 'acknowledged',
});
```

---

## Organization

### Get Organization

```typescript
const org = await client.org.get();

console.log(`${org.name} (${org.plan_id} plan)`);
console.log(`PII detection: ${org.settings.pii_detection_enabled}`);
```

### Update Organization

```typescript
await client.org.update({
  name: 'Acme Corporation',
  settings: {
    auto_archive_days: 365,
  },
});
```

---

## API Keys

### List API Keys

```typescript
const { data: keys } = await client.apiKeys.list();

for (const key of keys) {
  console.log(`${key.name} (${key.key_prefix}...) - scopes: ${key.scopes.join(', ')}`);
}
```

### Create an API Key

```typescript
const newKey = await client.apiKeys.create({
  name: 'Worker Service Key',
  scopes: ['query:read', 'knowledge:read', 'connectors:read'],
  expires_at: '2027-01-01T00:00:00Z',
});

// IMPORTANT: The full key is only returned once
console.log(`Key: ${newKey.key}`);
console.log(`Store this securely -- it will not be shown again.`);
```

### Delete an API Key

```typescript
await client.apiKeys.delete('key_002');
```

---

## Error Handling

The SDK throws typed errors for all API failures:

```typescript
import { TribeMemClient, TribeMemError } from '@tribemem/sdk';

const client = new TribeMemClient({ apiKey: 'tm_live_xxx' });

try {
  const result = await client.query('How does deployment work?');
  console.log(result.answer);
} catch (error) {
  if (error instanceof TribeMemError) {
    console.error(`API error: ${error.code} - ${error.message}`);
    console.error(`Status: ${error.status}`);
    console.error(`Details:`, error.details);

    switch (error.code) {
      case 'unauthorized':
        console.error('Check your API key.');
        break;
      case 'rate_limited':
        console.error(`Retry after ${error.retryAfter} seconds.`);
        break;
      case 'validation_error':
        console.error('Invalid request parameters.');
        break;
      default:
        console.error('Unexpected error.');
    }
  } else {
    // Network error, timeout, etc.
    console.error('Connection error:', error);
  }
}
```

### Error Types

```typescript
class TribeMemError extends Error {
  /** HTTP status code */
  status: number;

  /** Error code from the API */
  code: string;

  /** Additional error details */
  details?: Record<string, unknown>;

  /** Seconds to wait before retrying (for rate limit errors) */
  retryAfter?: number;
}
```

---

## TypeScript Types

The SDK re-exports all types from `@tribemem/shared` for convenience:

```typescript
import type {
  // Knowledge
  KnowledgeUnit,
  KnowledgeVersion,
  KnowledgeType,
  KnowledgeCategory,
  KnowledgeStatus,
  ConfidenceLevel,
  ChangeType,

  // Query
  QueryRequest,
  QueryResponse,
  QueryFilters,
  QuerySource,

  // Entities
  Entity,
  EntityRelation,
  EntityType,
  RelationType,

  // Connectors
  Connector,
  ConnectorType,
  ConnectorStatus,
  ConnectorConfig,
  RawEvent,

  // Crawler
  CrawlerRun,
  CrawlerRunSummary,
  CrawlerStatus,

  // Alerts
  Alert,
  AlertRule,
  AlertType,
  AlertSeverity,
  AlertStatus,

  // Auth
  Organization,
  OrganizationSettings,
  ApiKey,
  ApiKeyScope,

  // Billing
  Plan,
  PlanId,
  PlanLimits,
  Subscription,
} from '@tribemem/sdk';
```
