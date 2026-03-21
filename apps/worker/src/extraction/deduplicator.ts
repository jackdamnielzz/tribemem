import type { ExtractedFact } from '@tribemem/shared';
import { getSupabaseClient, insertSourceLink } from '../lib/supabase';
import { generateEmbedding, cosineSimilarity } from '../memory/vector';

const DUPLICATE_THRESHOLD = 0.95;

export interface DeduplicationResult {
  isDuplicate: boolean;
  /** If duplicate, the ID of the existing knowledge unit */
  existingId: string | null;
  /** Similarity score if a close match was found */
  similarity: number;
}

/**
 * Check if an extracted fact is a duplicate of existing knowledge.
 * If the vector similarity exceeds the threshold, it's considered a duplicate
 * and the sources are merged instead of creating a new knowledge unit.
 */
export async function checkDuplicate(
  orgId: string,
  fact: ExtractedFact,
  rawEventIds: string[],
): Promise<DeduplicationResult> {
  const sb = getSupabaseClient();

  // Generate embedding for the new fact
  const factText = `${fact.title}: ${fact.content}`;
  const embedding = await generateEmbedding(factText);

  // Search for similar knowledge units using vector similarity
  const { data: matches, error } = await sb.rpc('match_knowledge_units', {
    query_embedding: embedding,
    match_threshold: DUPLICATE_THRESHOLD,
    match_count: 5,
    p_org_id: orgId,
  });

  if (error) {
    console.warn('[Deduplicator] Vector search failed:', error.message);
    // If search fails, assume not duplicate and allow creation
    return { isDuplicate: false, existingId: null, similarity: 0 };
  }

  if (!matches || matches.length === 0) {
    return { isDuplicate: false, existingId: null, similarity: 0 };
  }

  const topMatch = matches[0] as { id: string; similarity: number };

  if (topMatch.similarity >= DUPLICATE_THRESHOLD) {
    // It's a duplicate - merge sources
    await mergeSources(topMatch.id, rawEventIds);

    // Update evidence count and last confirmed
    await sb
      .from('knowledge_units')
      .update({
        evidence_count: sb.rpc('increment', { x: 1 }) as unknown as number,
        last_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', topMatch.id);

    return {
      isDuplicate: true,
      existingId: topMatch.id,
      similarity: topMatch.similarity,
    };
  }

  return {
    isDuplicate: false,
    existingId: null,
    similarity: topMatch.similarity,
  };
}

/**
 * Link additional source events to an existing knowledge unit.
 */
async function mergeSources(
  knowledgeUnitId: string,
  rawEventIds: string[],
): Promise<void> {
  for (const rawEventId of rawEventIds) {
    try {
      await insertSourceLink({
        knowledge_unit_id: knowledgeUnitId,
        raw_event_id: rawEventId,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Source link may already exist; safe to ignore duplicates
    }
  }
}
