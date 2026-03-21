import { getSupabaseClient } from '../lib/supabase';

// Embedding dimension for text-embedding-3-small
const EMBEDDING_DIMENSION = 1536;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Generate an embedding vector for a given text string.
 * Uses OpenAI's text-embedding-3-small model.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    console.warn('[Vector] OPENAI_API_KEY not set, returning zero vector');
    return new Array(EMBEDDING_DIMENSION).fill(0);
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000), // Truncate to model's input limit
    }),
  });

  if (!response.ok) {
    throw new Error(
      `OpenAI embedding API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
  };

  return data.data[0]!.embedding;
}

/**
 * Generate embeddings for multiple texts in a single batch call.
 */
export async function generateEmbeddingsBatch(
  texts: string[],
): Promise<number[][]> {
  if (texts.length === 0) return [];

  if (!OPENAI_API_KEY) {
    console.warn('[Vector] OPENAI_API_KEY not set, returning zero vectors');
    return texts.map(() => new Array(EMBEDDING_DIMENSION).fill(0));
  }

  // OpenAI supports batch embedding
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts.map((t) => t.slice(0, 8000)),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `OpenAI embedding API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[]; index: number }>;
  };

  // Sort by index to maintain order
  const sorted = data.data.sort((a, b) => a.index - b.index);
  return sorted.map((d) => d.embedding);
}

/**
 * Calculate cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have equal dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Search for similar knowledge units using vector similarity.
 * Wraps the Supabase RPC function for vector search.
 */
export async function searchSimilar(
  orgId: string,
  queryText: string,
  options: {
    threshold?: number;
    limit?: number;
    categories?: string[];
    types?: string[];
  } = {},
): Promise<
  Array<{
    id: string;
    title: string;
    content: string;
    similarity: number;
    confidence_score: number;
    type: string;
    category: string;
  }>
> {
  const sb = getSupabaseClient();
  const embedding = await generateEmbedding(queryText);

  const { data, error } = await sb.rpc('match_knowledge_units', {
    query_embedding: embedding,
    match_threshold: options.threshold ?? 0.7,
    match_count: options.limit ?? 20,
    p_org_id: orgId,
  });

  if (error) {
    console.error('[Vector] Search failed:', error.message);
    return [];
  }

  let results = (data ?? []) as Array<{
    id: string;
    title: string;
    content: string;
    similarity: number;
    confidence_score: number;
    type: string;
    category: string;
  }>;

  // Apply optional filters
  if (options.categories && options.categories.length > 0) {
    results = results.filter((r) =>
      options.categories!.includes(r.category),
    );
  }

  if (options.types && options.types.length > 0) {
    results = results.filter((r) => options.types!.includes(r.type));
  }

  return results;
}

/**
 * Store an embedding for a knowledge unit.
 */
export async function storeEmbedding(
  knowledgeUnitId: string,
  embedding: number[],
): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb.from('knowledge_embeddings').upsert(
    {
      knowledge_unit_id: knowledgeUnitId,
      embedding,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'knowledge_unit_id' },
  );

  if (error) {
    throw new Error(`Failed to store embedding: ${error.message}`);
  }
}
