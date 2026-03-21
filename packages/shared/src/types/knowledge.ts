import type { EntityType } from './entity';

export type KnowledgeType = 'fact' | 'process' | 'decision' | 'norm' | 'definition';

export type KnowledgeCategory =
  | 'engineering'
  | 'support'
  | 'hr'
  | 'finance'
  | 'product'
  | 'operations'
  | 'sales'
  | 'general';

export type KnowledgeStatus =
  | 'active'
  | 'superseded'
  | 'contradicted'
  | 'archived'
  | 'flagged';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type TemporalContext = 'current' | 'historical' | 'planned';

export type ChangeType =
  | 'created'
  | 'updated'
  | 'superseded'
  | 'contradicted'
  | 'confirmed'
  | 'archived';

export interface KnowledgeUnit {
  id: string;
  org_id: string;
  type: KnowledgeType;
  category: KnowledgeCategory | null;
  title: string;
  content: string;
  confidence_score: number;
  evidence_count: number;
  last_confirmed_at: string | null;
  is_current: boolean;
  superseded_by: string | null;
  supersedes: string | null;
  valid_from: string;
  valid_until: string | null;
  status: KnowledgeStatus;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeVersion {
  id: string;
  knowledge_unit_id: string;
  version_number: number;
  change_type: ChangeType;
  previous_content: string | null;
  new_content: string | null;
  change_reason: string | null;
  changed_by: string;
  created_at: string;
}

export interface ExtractedFact {
  type: KnowledgeType;
  title: string;
  content: string;
  category: KnowledgeCategory;
  confidence: ConfidenceLevel;
  entities: ExtractedEntity[];
  temporal_context: TemporalContext;
  tags: string[];
}

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  role: string;
}
