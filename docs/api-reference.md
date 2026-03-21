# API Reference

Base URL: `https://api.tribemem.ai/v1`

All endpoints require authentication and return JSON.

---

## Authentication

Include your API key as a Bearer token in the `Authorization` header:

```
Authorization: Bearer tm_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

API keys are created in the dashboard under **Settings > API Keys**. Each key has a set of scopes that control which endpoints it can access.

### Scopes

| Scope | Grants access to |
|-------|-----------------|
| `query:read` | `POST /v1/query` |
| `knowledge:read` | `GET /v1/knowledge`, `GET /v1/knowledge/:id`, `GET /v1/knowledge/:id/history` |
| `knowledge:write` | Modify knowledge units |
| `connectors:read` | `GET /v1/connectors` |
| `connectors:write` | `POST`, `PATCH`, `DELETE /v1/connectors` |
| `members:read` | `GET /v1/org` |
| `members:write` | `PATCH /v1/org` |
| `billing:read` | Read billing and usage data |
| `billing:write` | Modify billing settings |
| `alerts:read` | `GET /v1/alerts` |
| `alerts:write` | `PATCH /v1/alerts` |

---

## Pagination

List endpoints support cursor-based pagination:

```
GET /v1/knowledge?limit=20&offset=0
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 20 | Number of items per page (max 100) |
| `offset` | integer | 0 | Number of items to skip |

All list responses include a `pagination` object:

```json
{
  "data": [...],
  "pagination": {
    "total": 142,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

## Rate Limits

Rate limits are applied per organization, per minute:

| Plan | Query endpoints | General API | Webhook ingestion |
|------|----------------|-------------|-------------------|
| Free | 5/min | 30/min | 10/min |
| Starter | 20/min | 120/min | 50/min |
| Growth | 60/min | 300/min | 200/min |
| Business | 200/min | 1,000/min | 500/min |
| Enterprise | 1,000/min | 5,000/min | 2,000/min |

Rate limit headers are included in every response:

```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 117
X-RateLimit-Reset: 1700000000
```

When the limit is exceeded, the API returns `429 Too Many Requests`.

---

## Error Response Format

All errors follow a consistent structure:

```json
{
  "error": {
    "code": "validation_error",
    "message": "The 'query' field is required.",
    "details": {
      "field": "query",
      "rule": "required"
    }
  }
}
```

### Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `validation_error` | Request body or parameters are invalid |
| 401 | `unauthorized` | Missing or invalid API key |
| 403 | `forbidden` | API key lacks required scope |
| 404 | `not_found` | Resource does not exist |
| 409 | `conflict` | Resource conflict (e.g., duplicate connector) |
| 429 | `rate_limited` | Rate limit exceeded |
| 500 | `internal_error` | Unexpected server error |

---

## Endpoints

### Query Knowledge

```
POST /v1/query
```

Ask a natural-language question against your organization's knowledge base.

**Required scope:** `query:read`

#### Request Body

```json
{
  "query": "What is our deployment process for production releases?",
  "filters": {
    "categories": ["engineering"],
    "types": ["process", "decision"],
    "tags": ["deployment"],
    "min_confidence": 0.7,
    "date_from": "2025-01-01",
    "date_to": "2026-03-21",
    "connector_types": ["slack", "notion"]
  },
  "max_results": 10,
  "include_related": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Natural-language question (max 2,000 characters) |
| `filters` | object | No | Narrow the search scope |
| `filters.categories` | string[] | No | Filter by category: `engineering`, `support`, `hr`, `finance`, `product`, `operations`, `sales`, `general` |
| `filters.types` | string[] | No | Filter by knowledge type: `fact`, `process`, `decision`, `norm`, `definition` |
| `filters.tags` | string[] | No | Filter by tags |
| `filters.min_confidence` | number | No | Minimum confidence score (0-1) |
| `filters.date_from` | string | No | ISO 8601 date, only include knowledge valid from this date |
| `filters.date_to` | string | No | ISO 8601 date, only include knowledge valid until this date |
| `filters.connector_types` | string[] | No | Only include knowledge sourced from these connectors |
| `max_results` | integer | No | Maximum knowledge units to consider (default 10) |
| `include_related` | boolean | No | Include related follow-up questions (default false) |

#### Response `200 OK`

```json
{
  "answer": "Production deployments follow a three-step process: ...",
  "confidence": 0.92,
  "sources": [
    {
      "knowledge_unit_id": "ku_abc123",
      "title": "Production Deployment Process",
      "content_snippet": "All production releases must pass through staging first...",
      "relevance_score": 0.95,
      "confidence": "high",
      "last_confirmed_at": "2026-03-15T10:30:00Z"
    }
  ],
  "knowledge_units_used": ["ku_abc123", "ku_def456"],
  "related_questions": [
    "What are the rollback procedures?",
    "Who approves production deployments?"
  ],
  "metadata": {
    "retrieval_time_ms": 120,
    "synthesis_time_ms": 850,
    "tokens_used": 1240
  }
}
```

---

### List Knowledge Units

```
GET /v1/knowledge
```

Retrieve a paginated list of knowledge units.

**Required scope:** `knowledge:read`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by type: `fact`, `process`, `decision`, `norm`, `definition` |
| `category` | string | Filter by category |
| `status` | string | Filter by status: `active`, `superseded`, `contradicted`, `archived`, `flagged` |
| `tags` | string | Comma-separated tag list |
| `search` | string | Full-text search over title and content |
| `min_confidence` | number | Minimum confidence score (0-1) |
| `limit` | integer | Items per page (default 20, max 100) |
| `offset` | integer | Items to skip (default 0) |

#### Response `200 OK`

```json
{
  "data": [
    {
      "id": "ku_abc123",
      "type": "process",
      "category": "engineering",
      "title": "Production Deployment Process",
      "content": "All production releases follow a three-step process...",
      "confidence_score": 0.92,
      "evidence_count": 7,
      "last_confirmed_at": "2026-03-15T10:30:00Z",
      "is_current": true,
      "superseded_by": null,
      "supersedes": null,
      "valid_from": "2025-06-01T00:00:00Z",
      "valid_until": null,
      "status": "active",
      "tags": ["deployment", "production", "ci-cd"],
      "metadata": {},
      "created_at": "2025-06-02T14:20:00Z",
      "updated_at": "2026-03-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 1542,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

### Get Knowledge Unit

```
GET /v1/knowledge/:id
```

Retrieve a single knowledge unit by ID.

**Required scope:** `knowledge:read`

#### Response `200 OK`

Returns the full `KnowledgeUnit` object (same shape as the list items above).

---

### Get Version History

```
GET /v1/knowledge/:id/history
```

Retrieve the version history for a knowledge unit.

**Required scope:** `knowledge:read`

#### Response `200 OK`

```json
{
  "data": [
    {
      "id": "kv_001",
      "knowledge_unit_id": "ku_abc123",
      "version_number": 3,
      "change_type": "updated",
      "previous_content": "Deployments are done manually via SSH...",
      "new_content": "All production releases follow a three-step process...",
      "change_reason": "Process updated based on new Slack discussion in #engineering",
      "changed_by": "system",
      "created_at": "2026-03-15T10:30:00Z"
    },
    {
      "id": "kv_000",
      "knowledge_unit_id": "ku_abc123",
      "version_number": 2,
      "change_type": "confirmed",
      "previous_content": null,
      "new_content": null,
      "change_reason": "Confirmed by repeated mentions in Jira tickets",
      "changed_by": "system",
      "created_at": "2025-11-20T08:15:00Z"
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

Change types: `created`, `updated`, `superseded`, `contradicted`, `confirmed`, `archived`.

---

### List Entities

```
GET /v1/entities
```

Retrieve extracted entities (people, teams, systems, projects, etc.).

**Required scope:** `knowledge:read`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by entity type: `person`, `team`, `system`, `tool`, `process`, `client`, `project`, `concept`, `channel`, `repository`, `other` |
| `search` | string | Search by name or alias |
| `limit` | integer | Items per page (default 20, max 100) |
| `offset` | integer | Items to skip |

#### Response `200 OK`

```json
{
  "data": [
    {
      "id": "ent_xyz789",
      "name": "Payment Service",
      "type": "system",
      "description": "Handles all payment processing via Stripe",
      "aliases": ["payments-api", "billing-service"],
      "metadata": {},
      "first_seen_at": "2025-03-10T09:00:00Z",
      "last_seen_at": "2026-03-20T16:45:00Z",
      "mention_count": 84,
      "created_at": "2025-03-10T09:00:00Z",
      "updated_at": "2026-03-20T16:45:00Z"
    }
  ],
  "pagination": {
    "total": 312,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

### Get Entity Relations

```
GET /v1/entities/:id/relations
```

Retrieve relationships for an entity.

**Required scope:** `knowledge:read`

#### Response `200 OK`

```json
{
  "data": [
    {
      "id": "rel_001",
      "source_entity_id": "ent_xyz789",
      "target_entity_id": "ent_abc123",
      "relation_type": "depends_on",
      "confidence": 0.88,
      "evidence_count": 5,
      "metadata": {},
      "created_at": "2025-04-15T12:00:00Z",
      "updated_at": "2026-02-10T09:30:00Z"
    }
  ],
  "pagination": {
    "total": 8,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

Relation types: `manages`, `uses`, `owns`, `depends_on`, `part_of`, `works_on`.

---

### List Connectors

```
GET /v1/connectors
```

List all configured connectors for the organization.

**Required scope:** `connectors:read`

#### Response `200 OK`

```json
{
  "data": [
    {
      "id": "conn_001",
      "type": "slack",
      "status": "active",
      "display_name": "Acme Slack Workspace",
      "config": {
        "scopes": ["channels:history", "channels:read", "users:read"],
        "settings": {
          "selected_channels": ["#engineering", "#product", "#general"]
        }
      },
      "last_sync_at": "2026-03-21T08:00:00Z",
      "last_sync_error": null,
      "events_processed": 24580,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2026-03-21T08:00:00Z"
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

---

### Create Connector

```
POST /v1/connectors
```

Initiate a new connector integration.

**Required scope:** `connectors:write`

#### Request Body

```json
{
  "type": "slack",
  "display_name": "Acme Slack Workspace",
  "settings": {
    "selected_channels": ["#engineering", "#product"]
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Connector type (see supported connectors) |
| `display_name` | string | Yes | Human-readable name |
| `settings` | object | No | Connector-specific configuration |

#### Response `201 Created`

Returns the created connector object along with an `oauth_url` (if the connector uses OAuth) to redirect the user for authorization:

```json
{
  "data": {
    "id": "conn_002",
    "type": "slack",
    "status": "pending",
    "display_name": "Acme Slack Workspace",
    "oauth_url": "https://slack.com/oauth/v2/authorize?client_id=...&scope=..."
  }
}
```

---

### Update Connector

```
PATCH /v1/connectors/:id
```

Update a connector's display name or settings.

**Required scope:** `connectors:write`

#### Request Body

```json
{
  "display_name": "Updated Name",
  "settings": {
    "selected_channels": ["#engineering", "#product", "#support"]
  },
  "status": "paused"
}
```

#### Response `200 OK`

Returns the updated connector object.

---

### Delete Connector

```
DELETE /v1/connectors/:id
```

Remove a connector and optionally its associated raw events.

**Required scope:** `connectors:write`

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `delete_events` | boolean | false | Also delete raw events from this connector |

#### Response `204 No Content`

---

### List Crawler Runs

```
GET /v1/crawler
```

List recent crawler runs.

**Required scope:** `connectors:read`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `connector_id` | string | Filter by connector |
| `status` | string | Filter by status: `pending`, `running`, `completed`, `failed`, `cancelled` |
| `limit` | integer | Items per page (default 20) |
| `offset` | integer | Items to skip |

#### Response `200 OK`

```json
{
  "data": [
    {
      "id": "run_001",
      "connector_id": "conn_001",
      "connector_type": "slack",
      "status": "completed",
      "started_at": "2026-03-21T08:00:00Z",
      "completed_at": "2026-03-21T08:04:32Z",
      "events_discovered": 150,
      "events_ingested": 148,
      "events_failed": 2,
      "knowledge_units_created": 12,
      "knowledge_units_updated": 5,
      "error_message": null,
      "created_at": "2026-03-21T08:00:00Z",
      "updated_at": "2026-03-21T08:04:32Z"
    }
  ],
  "pagination": {
    "total": 87,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

### Trigger Crawler Run

```
POST /v1/crawler
```

Manually trigger a crawler run for a specific connector.

**Required scope:** `connectors:write`

#### Request Body

```json
{
  "connector_id": "conn_001",
  "full_sync": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `connector_id` | string | Yes | Connector to crawl |
| `full_sync` | boolean | No | Ignore cursor and re-crawl everything (default false) |

#### Response `202 Accepted`

```json
{
  "data": {
    "id": "run_002",
    "connector_id": "conn_001",
    "status": "pending"
  }
}
```

---

### List Alerts

```
GET /v1/alerts
```

List alerts for the organization.

**Required scope:** `alerts:read`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by type: `contradiction`, `process_drift`, `knowledge_gap`, `stale_knowledge`, `connector_error`, `usage_limit` |
| `severity` | string | Filter by severity: `critical`, `high`, `medium`, `low`, `info` |
| `status` | string | Filter by status: `open`, `acknowledged`, `resolved`, `dismissed` |
| `limit` | integer | Items per page |
| `offset` | integer | Items to skip |

#### Response `200 OK`

```json
{
  "data": [
    {
      "id": "alert_001",
      "type": "contradiction",
      "severity": "high",
      "status": "open",
      "title": "Contradicting deployment process found",
      "description": "A new Slack message contradicts the documented deployment process...",
      "related_entity_ids": ["ku_abc123", "ku_def456"],
      "details": {
        "existing_unit_id": "ku_abc123",
        "new_unit_id": "ku_def456",
        "contradiction_summary": "Existing: 3-step process. New: direct deploy to production."
      },
      "acknowledged_by": null,
      "acknowledged_at": null,
      "resolved_by": null,
      "resolved_at": null,
      "created_at": "2026-03-20T14:30:00Z",
      "updated_at": "2026-03-20T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

---

### Update Alert

```
PATCH /v1/alerts/:id
```

Acknowledge, resolve, or dismiss an alert.

**Required scope:** `alerts:write`

#### Request Body

```json
{
  "status": "acknowledged"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | New status: `acknowledged`, `resolved`, `dismissed` |

#### Response `200 OK`

Returns the updated alert object.

---

### Get Organization

```
GET /v1/org
```

Get the current organization's details and settings.

**Required scope:** `members:read`

#### Response `200 OK`

```json
{
  "data": {
    "id": "org_001",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "plan_id": "growth",
    "logo_url": null,
    "settings": {
      "default_language": "en",
      "pii_detection_enabled": true,
      "auto_archive_days": 180,
      "notification_email": "admin@acme.com",
      "allowed_domains": ["acme.com"]
    },
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2026-03-10T12:00:00Z"
  }
}
```

---

### Update Organization

```
PATCH /v1/org
```

Update organization name or settings.

**Required scope:** `members:write`

#### Request Body

```json
{
  "name": "Acme Corporation",
  "settings": {
    "pii_detection_enabled": true,
    "auto_archive_days": 365
  }
}
```

#### Response `200 OK`

Returns the updated organization object.

---

### List API Keys

```
GET /v1/api-keys
```

List all API keys for the organization (keys are redacted to prefix only).

**Required scope:** `members:read`

#### Response `200 OK`

```json
{
  "data": [
    {
      "id": "key_001",
      "name": "MCP Server Key",
      "key_prefix": "tm_live_abc12",
      "scopes": ["query:read", "knowledge:read"],
      "created_by": "user_001",
      "last_used_at": "2026-03-21T09:15:00Z",
      "expires_at": null,
      "revoked_at": null,
      "created_at": "2025-06-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

---

### Create API Key

```
POST /v1/api-keys
```

Create a new API key. The full key is returned only in this response.

**Required scope:** `members:write`

#### Request Body

```json
{
  "name": "CI Pipeline Key",
  "scopes": ["query:read", "knowledge:read"],
  "expires_at": "2027-01-01T00:00:00Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Human-readable name for the key |
| `scopes` | string[] | Yes | List of permission scopes |
| `expires_at` | string | No | ISO 8601 expiration date (null = never) |

#### Response `201 Created`

```json
{
  "data": {
    "id": "key_002",
    "name": "CI Pipeline Key",
    "key": "tm_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "key_prefix": "tm_live_xxxxx",
    "scopes": ["query:read", "knowledge:read"],
    "expires_at": "2027-01-01T00:00:00Z",
    "created_at": "2026-03-21T12:00:00Z"
  }
}
```

**Important:** The `key` field is only returned once. Store it securely.

---

### Delete API Key

```
DELETE /v1/api-keys/:id
```

Revoke an API key. The key becomes immediately unusable.

**Required scope:** `members:write`

#### Response `204 No Content`
