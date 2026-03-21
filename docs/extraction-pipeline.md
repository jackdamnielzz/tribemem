# Extraction Pipeline

This document describes how TribeMem transforms raw events from connectors into structured, queryable knowledge.

---

## Pipeline Overview

```
Raw Events (from connectors)
       │
       │  1. Batch Aggregation
       ▼
┌──────────────┐
│  Event Batch  │   Grouped by connector + time window + context
└──────┬───────┘
       │
       │  2. LLM Extraction (Claude Haiku)
       ▼
┌──────────────┐
│  Extracted    │   Candidate knowledge units + entities
│  Candidates   │
└──────┬───────┘
       │
       │  3. Deduplication + Entity Resolution
       ▼
┌──────────────┐
│  Resolved     │   Merged with existing knowledge, entities linked
│  Units        │
└──────┬───────┘
       │
       │  4. Contradiction Check
       ▼
┌──────────────┐
│  Validated    │   Contradictions flagged, alerts raised
│  Units        │
└──────┬───────┘
       │
       │  5. Confidence Scoring + Embedding
       ▼
┌──────────────┐
│  Knowledge    │   Stored with vector embedding and version history
│  Units        │
└──────────────┘
```

---

## 1. Batch Aggregation

Raw events are not processed individually. Instead, the pipeline groups them into batches to provide the LLM with enough context for accurate extraction.

### Batching Strategy by Connector

| Connector | Batch grouping | Typical batch size |
|-----------|---------------|-------------------|
| **Slack** | By channel + thread, within a 1-hour window | 10-50 messages |
| **Notion** | By page (full page content per batch) | 1 page |
| **Jira** | By issue (all recent comments and status changes) | 5-20 events |
| **GitHub** | By PR or issue (discussion thread) | 5-30 events |
| **Intercom** | By conversation | 5-40 messages |
| **Linear** | By issue | 3-15 events |
| **Google Drive** | By document (full content snapshot) | 1 document |
| **HubSpot** | By deal or contact (recent activity) | 5-20 events |
| **Stripe** | By customer (recent events) | 3-10 events |

### Why Batch?

- **Context matters.** A single Slack message like "let's go with option B" is meaningless without the preceding discussion. Batching provides the thread.
- **Token efficiency.** One LLM call on a batch of 20 messages is cheaper and faster than 20 individual calls.
- **Higher extraction quality.** The LLM can identify patterns, decisions, and consensus across multiple messages that would be invisible in isolation.

---

## 2. LLM Extraction

Each batch is sent to **Claude Haiku** (optimized for speed and cost at extraction scale) with a structured prompt that instructs the model to identify:

### Knowledge Types

| Type | Description | Example |
|------|-------------|---------|
| `fact` | A verifiable statement about the organization | "The API rate limit is 1,000 requests per minute" |
| `process` | A documented procedure or workflow | "Deployments require two approvals before merge" |
| `decision` | A choice that was made, with context | "We chose PostgreSQL over MongoDB for the new service" |
| `norm` | An unwritten rule or convention | "PRs should be reviewed within 24 hours" |
| `definition` | A term or concept specific to the organization | "Golden path: our recommended tech stack for new services" |

### Extraction Prompt Structure

The extraction prompt instructs the model to return a JSON array of extracted facts:

```
You are analyzing internal communications for an organization.
Extract structured knowledge from the following batch of messages.

For each piece of knowledge, provide:
- type: fact | process | decision | norm | definition
- title: concise summary (max 100 chars)
- content: detailed description with context
- category: engineering | support | hr | finance | product | operations | sales | general
- confidence: high | medium | low
- entities: people, teams, systems, or tools mentioned
- temporal_context: current | historical | planned
- tags: relevant keywords

Rules:
- Only extract knowledge that would be useful to someone joining the team.
- Ignore small talk, greetings, and off-topic messages.
- If a decision was made, capture the alternatives considered and the reasoning.
- If a process is described, capture all steps.
- Mark confidence as "low" when the information is speculative or uncertain.

Messages:
[batch content here]
```

### Output Format

```json
[
  {
    "type": "decision",
    "title": "Chose Redis over Memcached for session storage",
    "content": "The backend team decided to use Redis instead of Memcached for session storage. Redis was preferred because it supports data structures beyond simple key-value pairs, which will be useful for rate limiting. The decision was made by Sarah (Tech Lead) after testing both options in staging.",
    "category": "engineering",
    "confidence": "high",
    "entities": [
      { "name": "Sarah", "type": "person", "role": "decision maker" },
      { "name": "Backend Team", "type": "team", "role": "owner" },
      { "name": "Redis", "type": "tool", "role": "chosen" },
      { "name": "Memcached", "type": "tool", "role": "rejected" }
    ],
    "temporal_context": "current",
    "tags": ["redis", "session-storage", "infrastructure"]
  }
]
```

---

## 3. Deduplication and Entity Resolution

### Deduplication

Before storing new knowledge units, the pipeline checks for duplicates:

1. **Embedding similarity** -- Generate a vector embedding for the candidate and search for existing units with cosine similarity > 0.92.
2. **Title match** -- Fuzzy match against existing titles (Levenshtein distance < 3).
3. **Content overlap** -- If a near-duplicate is found, compare content to determine whether it is:
   - **Identical** -- Skip the candidate.
   - **An update** -- Create a new version of the existing unit (change type: `updated`).
   - **A confirmation** -- Boost the confidence of the existing unit (change type: `confirmed`).
   - **A contradiction** -- Flag both units and raise an alert (see step 4).

### Entity Resolution

Extracted entities are matched against the existing entity graph:

1. **Exact name match** -- Case-insensitive lookup.
2. **Alias match** -- Check against known aliases (e.g., "Sarah" matches "Sarah Chen").
3. **Fuzzy match** -- Levenshtein distance with type constraint (a "person" will not match a "system" even if names are similar).
4. **Create or merge** -- If no match is found, a new entity is created. If a match is found, the entity's `last_seen_at` and `mention_count` are updated.

Entity relations (e.g., "Sarah manages Backend Team") are extracted from context and stored in the `entity_relations` table with confidence scores.

---

## 4. Contradiction Check

When a candidate knowledge unit contradicts an existing one, the pipeline:

1. Identifies the conflicting pair using semantic similarity + LLM verification.
2. Calls **Claude Sonnet** (higher reasoning capability) to confirm the contradiction and generate a summary.
3. Creates an alert of type `contradiction` with severity `high`.
4. Marks the older unit's status as `contradicted` if the new information is clearly more recent and authoritative.
5. Stores both the original and contradicting unit, linked via `superseded_by` / `supersedes` fields.

The system does not automatically resolve contradictions. A human reviews the alert and decides which version is correct.

### Process Drift Detection

A special case of contradiction detection: when a newly observed behavior diverges from a documented process. For example, if the documented process says "deployments require two approvals" but recent Slack messages show people deploying with one approval, a `process_drift` alert is raised.

---

## 5. Confidence Scoring

Every knowledge unit carries a numeric `confidence_score` between 0 and 1.

### Initial Score

The initial confidence score is set based on the LLM's assessment:

| LLM confidence | Initial score |
|----------------|--------------|
| `high` | 0.85 |
| `medium` | 0.65 |
| `low` | 0.40 |

### Confirmation Boost

When the same knowledge is observed again from a different source or at a later time:

```
new_score = min(1.0, current_score + 0.05 * evidence_count_delta)
```

Each independent confirmation increases the score by 0.05, capped at 1.0.

### Temporal Decay

Knowledge that has not been confirmed recently gradually loses confidence:

```
decayed_score = current_score * (0.99 ^ days_since_last_confirmed)
```

This is a 1% daily decay, meaning a score of 0.90 drops to approximately 0.74 after 30 days without confirmation and to 0.33 after 100 days.

Knowledge units whose decayed score drops below 0.30 are automatically flagged with a `stale_knowledge` alert.

---

## PII Filtering

When `pii_detection_enabled` is turned on in organization settings, the pipeline applies PII filtering before storage:

### Detected PII Types

- Email addresses
- Phone numbers
- Social Security numbers / national IDs
- Credit card numbers
- Physical addresses
- Dates of birth
- Salary and compensation figures

### Filtering Behavior

1. The extraction prompt instructs the LLM to omit PII from extracted content.
2. A post-extraction regex pass catches any PII the LLM missed.
3. Detected PII is replaced with placeholder tokens (e.g., `[EMAIL]`, `[PHONE]`).
4. The original raw event retains the full content (it is never shown to end users directly).

---

## Token Budget Management

LLM API calls are the primary cost driver. The pipeline manages token usage with the following strategies:

### Batch Size Limits

Each batch is capped at approximately 4,000 tokens of input content. Larger batches are split.

### Model Selection

| Task | Model | Reason |
|------|-------|--------|
| Knowledge extraction | Claude Haiku | High throughput, low cost per token |
| Contradiction verification | Claude Sonnet | Better reasoning for nuanced comparisons |
| Query synthesis | Claude Sonnet | Higher quality answers for user-facing output |

### Cost Controls

- **Per-organization daily token budget** -- Configurable ceiling to prevent runaway costs. Extraction jobs are paused when the budget is exhausted.
- **Deduplication before extraction** -- Raw events that are exact duplicates (same `external_id`) are skipped before reaching the LLM.
- **Incremental sync** -- Connectors use cursors to fetch only new events, avoiding reprocessing of historical data (unless a full sync is explicitly requested).
- **Content truncation** -- Event content exceeding 50,000 characters (`MAX_CONTENT_LENGTH`) is truncated with a note appended for the LLM.
