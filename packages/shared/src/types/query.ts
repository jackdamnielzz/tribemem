import type { KnowledgeCategory, KnowledgeType, ConfidenceLevel } from './knowledge';

export type QueryType =
  | 'factual'
  | 'procedural'
  | 'exploratory'
  | 'comparative'
  | 'temporal';

export interface QueryRequest {
  query: string;
  org_id: string;
  user_id: string;
  /** Optional filters to narrow search scope */
  filters?: QueryFilters;
  /** Maximum number of knowledge units to consider */
  max_results?: number;
  /** Whether to include related questions in the response */
  include_related?: boolean;
}

export interface QueryFilters {
  categories?: KnowledgeCategory[];
  types?: KnowledgeType[];
  tags?: string[];
  min_confidence?: number;
  date_from?: string;
  date_to?: string;
  connector_types?: string[];
}

export interface QueryResponse {
  answer: string;
  confidence: number;
  sources: QuerySource[];
  knowledge_units_used: string[];
  related_questions: string[];
  metadata: QueryResponseMetadata;
}

export interface QueryResponseMetadata {
  retrieval_time_ms: number;
  synthesis_time_ms: number;
  tokens_used: number;
}

export interface QuerySource {
  knowledge_unit_id: string;
  title: string;
  content_snippet: string;
  relevance_score: number;
  confidence: ConfidenceLevel;
  last_confirmed_at: string | null;
}

export interface QueryAnalysis {
  original_query: string;
  query_type: QueryType;
  intent: string;
  entities: string[];
  categories: KnowledgeCategory[];
  temporal_scope: 'current' | 'historical' | 'any';
  reformulated_query: string;
}

export interface QueryLog {
  id: string;
  org_id: string;
  user_id: string;
  query: string;
  query_type: QueryType;
  response: QueryResponse;
  feedback_score: number | null;
  feedback_comment: string | null;
  created_at: string;
}
