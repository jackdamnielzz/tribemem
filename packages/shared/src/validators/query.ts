import { z } from 'zod';
import { SYSTEM_LIMITS } from '../constants/limits';
import { knowledgeCategorySchema, knowledgeTypeSchema } from './knowledge';

// ── Query Type ──

export const queryTypeSchema = z.enum([
  'factual',
  'procedural',
  'exploratory',
  'comparative',
  'temporal',
]);

// ── Query Filters ──

export const queryFiltersSchema = z.object({
  categories: z.array(knowledgeCategorySchema).optional(),
  types: z.array(knowledgeTypeSchema).optional(),
  tags: z.array(z.string().max(SYSTEM_LIMITS.MAX_TAG_LENGTH)).max(SYSTEM_LIMITS.MAX_QUERY_FILTERS).optional(),
  min_confidence: z.number().min(0).max(1).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  connector_types: z.array(z.string()).optional(),
});

// ── Query Request ──

export const queryRequestSchema = z.object({
  query: z.string().min(1).max(SYSTEM_LIMITS.MAX_QUERY_LENGTH),
  org_id: z.string().uuid(),
  user_id: z.string().uuid(),
  filters: queryFiltersSchema.optional(),
  max_results: z.number().int().min(1).max(SYSTEM_LIMITS.MAX_PAGE_SIZE).optional(),
  include_related: z.boolean().optional().default(true),
});

// ── Query Source ──

export const querySourceSchema = z.object({
  knowledge_unit_id: z.string().uuid(),
  title: z.string(),
  content_snippet: z.string(),
  relevance_score: z.number().min(0).max(1),
  confidence: z.enum(['high', 'medium', 'low']),
  last_confirmed_at: z.string().datetime().nullable(),
});

// ── Query Response Metadata ──

export const queryResponseMetadataSchema = z.object({
  retrieval_time_ms: z.number().int().min(0),
  synthesis_time_ms: z.number().int().min(0),
  tokens_used: z.number().int().min(0),
});

// ── Query Response ──

export const queryResponseSchema = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
  sources: z.array(querySourceSchema),
  knowledge_units_used: z.array(z.string().uuid()),
  related_questions: z.array(z.string()),
  metadata: queryResponseMetadataSchema,
});

// ── Query Analysis ──

export const queryAnalysisSchema = z.object({
  original_query: z.string(),
  query_type: queryTypeSchema,
  intent: z.string(),
  entities: z.array(z.string()),
  categories: z.array(knowledgeCategorySchema),
  temporal_scope: z.enum(['current', 'historical', 'any']),
  reformulated_query: z.string(),
});

// ── Inferred types ──

export type QueryRequestInput = z.infer<typeof queryRequestSchema>;
export type QueryFiltersInput = z.infer<typeof queryFiltersSchema>;
