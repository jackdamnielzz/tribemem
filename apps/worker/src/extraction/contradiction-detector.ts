import type { ExtractedFact } from '@tribemem/shared';
import { chatSonnet, parseJsonResponse } from '../lib/anthropic';
import { getSupabaseClient } from '../lib/supabase';
import { generateEmbedding } from '../memory/vector';
import {
  DETECT_CONTRADICTIONS_SYSTEM_PROMPT,
  DETECT_CONTRADICTIONS_USER_PROMPT,
} from './prompts/detect-contradictions';

export type ContradictionRelationship =
  | 'confirms'
  | 'updates'
  | 'contradicts'
  | 'unrelated';

export type RecommendedAction =
  | 'keep_both'
  | 'supersede_old'
  | 'flag_for_review'
  | 'ignore_new';

export interface ContradictionResult {
  relationship: ContradictionRelationship;
  confidence: number;
  reasoning: string;
  recommended_action: RecommendedAction;
  merge_suggestion: string | null;
  /** The existing knowledge unit ID that was compared against */
  existing_knowledge_id: string;
}

// Similarity range for contradiction checking
const MIN_SIMILARITY = 0.8;
const MAX_SIMILARITY = 0.95; // Above this is handled by deduplicator

interface SimilarKnowledge {
  id: string;
  title: string;
  content: string;
  confidence_score: number;
  last_confirmed_at: string | null;
  similarity: number;
}

/**
 * Check a new extracted fact for contradictions against existing knowledge.
 * Only checks facts in the 0.8-0.95 similarity range (close but not duplicate).
 */
export async function detectContradictions(
  orgId: string,
  fact: ExtractedFact,
): Promise<ContradictionResult[]> {
  const sb = getSupabaseClient();

  // Generate embedding for the new fact
  const factText = `${fact.title}: ${fact.content}`;
  const embedding = await generateEmbedding(factText);

  // Find similar (but not duplicate) knowledge units
  const { data: matches, error } = await sb.rpc('match_knowledge_units', {
    query_embedding: embedding,
    match_threshold: MIN_SIMILARITY,
    match_count: 10,
    p_org_id: orgId,
  });

  if (error) {
    console.warn(
      '[ContradictionDetector] Vector search failed:',
      error.message,
    );
    return [];
  }

  if (!matches || matches.length === 0) {
    return [];
  }

  // Filter to the contradiction-checking range
  const candidates = (matches as SimilarKnowledge[]).filter(
    (m) => m.similarity >= MIN_SIMILARITY && m.similarity < MAX_SIMILARITY,
  );

  if (candidates.length === 0) {
    return [];
  }

  const results: ContradictionResult[] = [];

  // Compare against each candidate using Sonnet for nuanced analysis
  for (const candidate of candidates) {
    try {
      const result = await compareWithAI(fact, candidate);
      results.push({
        ...result,
        existing_knowledge_id: candidate.id,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        `[ContradictionDetector] Comparison failed for ${candidate.id}:`,
        message,
      );
    }
  }

  return results;
}

/**
 * Use Sonnet for nuanced comparison of two knowledge pieces.
 */
async function compareWithAI(
  newFact: ExtractedFact,
  existing: SimilarKnowledge,
): Promise<Omit<ContradictionResult, 'existing_knowledge_id'>> {
  const confidenceMap: Record<string, number> = {
    high: 0.9,
    medium: 0.7,
    low: 0.5,
  };

  const userPrompt = DETECT_CONTRADICTIONS_USER_PROMPT
    .replace('{{EXISTING_TITLE}}', existing.title)
    .replace('{{EXISTING_CONTENT}}', existing.content)
    .replace(
      '{{EXISTING_CONFIDENCE}}',
      existing.confidence_score.toString(),
    )
    .replace(
      '{{EXISTING_LAST_CONFIRMED}}',
      existing.last_confirmed_at || 'never',
    )
    .replace('{{NEW_TITLE}}', newFact.title)
    .replace('{{NEW_CONTENT}}', newFact.content)
    .replace(
      '{{NEW_CONFIDENCE}}',
      (confidenceMap[newFact.confidence] ?? 0.5).toString(),
    );

  const response = await chatSonnet(
    [{ role: 'user', content: userPrompt }],
    {
      system: DETECT_CONTRADICTIONS_SYSTEM_PROMPT,
      maxTokens: 1024,
      temperature: 0,
    },
  );

  const parsed = parseJsonResponse<{
    relationship: ContradictionRelationship;
    confidence: number;
    reasoning: string;
    recommended_action: RecommendedAction;
    merge_suggestion: string | null;
  }>(response);

  return parsed;
}
