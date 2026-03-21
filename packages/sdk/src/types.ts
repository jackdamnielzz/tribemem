import type {
  KnowledgeCategory,
  KnowledgeType,
  KnowledgeStatus,
  AlertType,
  AlertSeverity,
  AlertStatus,
  CrawlerStatus as CrawlerRunStatus,
} from '@tribemem/shared';

// ---------------------------------------------------------------------------
// Generic pagination
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

// ---------------------------------------------------------------------------
// Knowledge
// ---------------------------------------------------------------------------

export interface ListKnowledgeParams extends PaginationParams {
  type?: KnowledgeType;
  category?: KnowledgeCategory;
  status?: KnowledgeStatus;
  tags?: string[];
  search?: string;
  sort_by?: 'created_at' | 'updated_at' | 'confidence_score';
  sort_order?: 'asc' | 'desc';
}

export interface KnowledgeHistory {
  knowledge_unit_id: string;
  versions: KnowledgeVersionEntry[];
}

export interface KnowledgeVersionEntry {
  id: string;
  version_number: number;
  change_type: string;
  previous_content: string | null;
  new_content: string | null;
  change_reason: string | null;
  changed_by: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export interface ListEntitiesParams extends PaginationParams {
  type?: string;
  search?: string;
  sort_by?: 'name' | 'mention_count' | 'last_seen_at';
  sort_order?: 'asc' | 'desc';
}

export interface EntityRelations {
  entity_id: string;
  relations: EntityRelationEntry[];
}

export interface EntityRelationEntry {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relation_type: string;
  confidence: number;
  evidence_count: number;
  source_entity_name: string;
  target_entity_name: string;
}

// ---------------------------------------------------------------------------
// Crawler
// ---------------------------------------------------------------------------

export interface ListCrawlerRunsParams extends PaginationParams {
  connector_id?: string;
  status?: CrawlerRunStatus;
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export interface ListAlertsParams extends PaginationParams {
  type?: AlertType;
  severity?: AlertSeverity;
  status?: AlertStatus;
}

// ---------------------------------------------------------------------------
// SDK Client Config
// ---------------------------------------------------------------------------

export interface TribeMemClientConfig {
  apiKey: string;
  baseUrl?: string;
  /** Custom fetch implementation (useful for testing or environments without global fetch). */
  fetch?: typeof globalThis.fetch;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export interface ApiErrorBody {
  error: string;
  message: string;
  status: number;
  details?: Record<string, unknown>;
}
