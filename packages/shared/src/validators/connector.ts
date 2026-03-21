import { z } from 'zod';

// ── Connector Type ──

export const connectorTypeSchema = z.enum([
  'slack',
  'teams',
  'notion',
  'confluence',
  'jira',
  'linear',
  'github',
  'gitlab',
  'intercom',
  'zendesk',
  'freshdesk',
  'google_drive',
  'hubspot',
  'stripe',
]);

// ── Connector Status ──

export const connectorStatusSchema = z.enum([
  'pending',
  'connected',
  'syncing',
  'active',
  'error',
  'paused',
  'revoked',
]);

// ── Connector Config ──

export const connectorConfigSchema = z.object({
  scopes: z.array(z.string()),
  settings: z.record(z.unknown()),
  webhook_url: z.string().url().optional(),
  webhook_secret: z.string().min(16).optional(),
});

// ── Create Connector ──

export const createConnectorSchema = z.object({
  org_id: z.string().uuid(),
  type: connectorTypeSchema,
  display_name: z.string().min(1).max(100),
  config: connectorConfigSchema,
  created_by: z.string().uuid(),
});

// ── Update Connector ──

export const updateConnectorSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  status: connectorStatusSchema.optional(),
  config: connectorConfigSchema.partial().optional(),
  last_sync_at: z.string().datetime().optional(),
  last_sync_error: z.string().max(2000).nullable().optional(),
});

// ── Connector (full) ──

export const connectorSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  type: connectorTypeSchema,
  status: connectorStatusSchema,
  display_name: z.string().min(1).max(100),
  config: connectorConfigSchema,
  credentials_encrypted: z.string().nullable(),
  last_sync_at: z.string().datetime().nullable(),
  last_sync_error: z.string().nullable(),
  events_processed: z.number().int().min(0),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ── Raw Event ──

export const rawEventSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  connector_id: z.string().uuid(),
  connector_type: connectorTypeSchema,
  external_id: z.string().min(1),
  event_type: z.string().min(1),
  author_external_id: z.string().nullable(),
  author_name: z.string().nullable(),
  content: z.string(),
  raw_payload: z.record(z.unknown()),
  occurred_at: z.string().datetime(),
  ingested_at: z.string().datetime(),
  processed: z.boolean(),
  processed_at: z.string().datetime().nullable(),
});

// ── Sync Cursor ──

export const syncCursorSchema = z.object({
  id: z.string().uuid(),
  connector_id: z.string().uuid(),
  cursor_type: z.string().min(1),
  cursor_value: z.string().min(1),
  metadata: z.record(z.unknown()),
  updated_at: z.string().datetime(),
});

// ── Inferred types ──

export type CreateConnectorInput = z.infer<typeof createConnectorSchema>;
export type UpdateConnectorInput = z.infer<typeof updateConnectorSchema>;
