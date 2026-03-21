import { z } from 'zod';
import { SYSTEM_LIMITS } from '../constants/limits';

// ── Enums ──

export const knowledgeTypeSchema = z.enum([
  'fact',
  'process',
  'decision',
  'norm',
  'definition',
]);

export const knowledgeCategorySchema = z.enum([
  'engineering',
  'support',
  'hr',
  'finance',
  'product',
  'operations',
  'sales',
  'general',
]);

export const knowledgeStatusSchema = z.enum([
  'active',
  'superseded',
  'contradicted',
  'archived',
  'flagged',
]);

export const confidenceLevelSchema = z.enum(['high', 'medium', 'low']);

export const temporalContextSchema = z.enum(['current', 'historical', 'planned']);

export const changeTypeSchema = z.enum([
  'created',
  'updated',
  'superseded',
  'contradicted',
  'confirmed',
  'archived',
]);

export const entityTypeSchema = z.enum([
  'person',
  'team',
  'system',
  'tool',
  'process',
  'client',
  'project',
  'concept',
  'channel',
  'repository',
  'other',
]);

// ── Knowledge Unit ──

export const knowledgeUnitSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  type: knowledgeTypeSchema,
  category: knowledgeCategorySchema.nullable(),
  title: z.string().min(1).max(SYSTEM_LIMITS.MAX_TITLE_LENGTH),
  content: z.string().min(1).max(SYSTEM_LIMITS.MAX_CONTENT_LENGTH),
  confidence_score: z.number().min(SYSTEM_LIMITS.MIN_CONFIDENCE_SCORE).max(SYSTEM_LIMITS.MAX_CONFIDENCE_SCORE),
  evidence_count: z.number().int().min(0),
  last_confirmed_at: z.string().datetime().nullable(),
  is_current: z.boolean(),
  superseded_by: z.string().uuid().nullable(),
  supersedes: z.string().uuid().nullable(),
  valid_from: z.string().datetime(),
  valid_until: z.string().datetime().nullable(),
  status: knowledgeStatusSchema,
  tags: z.array(z.string().max(SYSTEM_LIMITS.MAX_TAG_LENGTH)).max(SYSTEM_LIMITS.MAX_TAGS_PER_UNIT),
  metadata: z.record(z.unknown()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createKnowledgeUnitSchema = knowledgeUnitSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  evidence_count: true,
  last_confirmed_at: true,
  is_current: true,
  superseded_by: true,
  supersedes: true,
}).extend({
  evidence_count: z.number().int().min(0).optional().default(1),
  is_current: z.boolean().optional().default(true),
  superseded_by: z.string().uuid().nullable().optional().default(null),
  supersedes: z.string().uuid().nullable().optional().default(null),
  last_confirmed_at: z.string().datetime().nullable().optional().default(null),
});

export const updateKnowledgeUnitSchema = knowledgeUnitSchema
  .omit({ id: true, org_id: true, created_at: true, updated_at: true })
  .partial();

// ── Knowledge Version ──

export const knowledgeVersionSchema = z.object({
  id: z.string().uuid(),
  knowledge_unit_id: z.string().uuid(),
  version_number: z.number().int().min(1),
  change_type: changeTypeSchema,
  previous_content: z.string().nullable(),
  new_content: z.string().nullable(),
  change_reason: z.string().max(1000).nullable(),
  changed_by: z.string().uuid(),
  created_at: z.string().datetime(),
});

// ── Extracted Fact ──

export const extractedEntitySchema = z.object({
  name: z.string().min(1).max(200),
  type: entityTypeSchema,
  role: z.string().min(1).max(200),
});

export const extractedFactSchema = z.object({
  type: knowledgeTypeSchema,
  title: z.string().min(1).max(SYSTEM_LIMITS.MAX_TITLE_LENGTH),
  content: z.string().min(1).max(SYSTEM_LIMITS.MAX_CONTENT_LENGTH),
  category: knowledgeCategorySchema,
  confidence: confidenceLevelSchema,
  entities: z.array(extractedEntitySchema).max(SYSTEM_LIMITS.MAX_ENTITIES_PER_FACT),
  temporal_context: temporalContextSchema,
  tags: z.array(z.string().max(SYSTEM_LIMITS.MAX_TAG_LENGTH)).max(SYSTEM_LIMITS.MAX_TAGS_PER_UNIT),
});

export const extractedFactsArraySchema = z.array(extractedFactSchema);

// ── Inferred types ──

export type KnowledgeUnitInput = z.infer<typeof createKnowledgeUnitSchema>;
export type KnowledgeUnitUpdate = z.infer<typeof updateKnowledgeUnitSchema>;
export type ExtractedFactInput = z.infer<typeof extractedFactSchema>;
