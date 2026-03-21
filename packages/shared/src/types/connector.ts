export type ConnectorType =
  | 'slack'
  | 'teams'
  | 'notion'
  | 'confluence'
  | 'jira'
  | 'linear'
  | 'github'
  | 'gitlab'
  | 'intercom'
  | 'zendesk'
  | 'freshdesk'
  | 'google_drive'
  | 'hubspot'
  | 'stripe';

export type ConnectorStatus =
  | 'pending'
  | 'connected'
  | 'syncing'
  | 'active'
  | 'error'
  | 'paused'
  | 'revoked';

export interface Connector {
  id: string;
  org_id: string;
  type: ConnectorType;
  status: ConnectorStatus;
  display_name: string;
  config: ConnectorConfig;
  credentials_encrypted: string | null;
  last_sync_at: string | null;
  last_sync_error: string | null;
  events_processed: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ConnectorConfig {
  /** OAuth or API token scopes granted */
  scopes: string[];
  /** Connector-specific settings (e.g., selected channels, repos) */
  settings: Record<string, unknown>;
  /** Webhook URL if the connector uses push-based sync */
  webhook_url?: string;
  /** Webhook secret for signature verification */
  webhook_secret?: string;
}

export interface RawEvent {
  id: string;
  org_id: string;
  connector_id: string;
  connector_type: ConnectorType;
  external_id: string;
  event_type: string;
  author_external_id: string | null;
  author_name: string | null;
  content: string;
  raw_payload: Record<string, unknown>;
  occurred_at: string;
  ingested_at: string;
  processed: boolean;
  processed_at: string | null;
}

export interface SyncCursor {
  id: string;
  connector_id: string;
  cursor_type: string;
  cursor_value: string;
  metadata: Record<string, unknown>;
  updated_at: string;
}
