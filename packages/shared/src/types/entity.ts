export type EntityType =
  | 'person'
  | 'team'
  | 'system'
  | 'tool'
  | 'process'
  | 'client'
  | 'project'
  | 'concept'
  | 'channel'
  | 'repository'
  | 'other';

export type RelationType =
  | 'manages'
  | 'uses'
  | 'owns'
  | 'depends_on'
  | 'part_of'
  | 'works_on';

export interface Entity {
  id: string;
  org_id: string;
  name: string;
  type: EntityType;
  description: string | null;
  aliases: string[];
  metadata: Record<string, unknown>;
  first_seen_at: string;
  last_seen_at: string;
  mention_count: number;
  created_at: string;
  updated_at: string;
}

export interface EntityRelation {
  id: string;
  org_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relation_type: RelationType;
  confidence: number;
  evidence_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
