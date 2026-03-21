import type { ConnectorType } from './connector';

export type CrawlerStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface CrawlerRun {
  id: string;
  org_id: string;
  connector_id: string;
  connector_type: ConnectorType;
  status: CrawlerStatus;
  started_at: string | null;
  completed_at: string | null;
  events_discovered: number;
  events_ingested: number;
  events_failed: number;
  knowledge_units_created: number;
  knowledge_units_updated: number;
  error_message: string | null;
  error_details: Record<string, unknown> | null;
  cursor_state: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CrawlerRunSummary {
  id: string;
  connector_type: ConnectorType;
  status: CrawlerStatus;
  started_at: string | null;
  completed_at: string | null;
  events_ingested: number;
  knowledge_units_created: number;
  knowledge_units_updated: number;
  duration_ms: number | null;
}
