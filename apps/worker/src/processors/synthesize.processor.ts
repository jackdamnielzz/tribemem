import { Worker, type Job, Queue } from 'bullmq';
import { createRedisConnection, getRedisConnection } from '../lib/redis';
import { chatHaiku, chatSonnet, parseJsonResponse } from '../lib/anthropic';
import { estimateTokenCount } from '../lib/tokens';
import { getSupabaseClient } from '../lib/supabase';
import { searchSimilar } from '../memory/vector';
import type {
  QueryRequest,
  QueryResponse,
  QueryAnalysis,
  QuerySource,
  KnowledgeCategory,
} from '@tribemem/shared';

const SYNTHESIZE_QUEUE_NAME = 'synthesize';

export interface SynthesizeJobData {
  request: QueryRequest;
}

export interface SynthesizeJobResult {
  response: QueryResponse;
}

const SYNTHESIZE_SYSTEM_PROMPT = `You are TribeMem, an organizational knowledge assistant. Your role is to synthesize accurate, well-sourced answers from the organization's knowledge base.

Rules:
1. Only use information from the provided knowledge sources
2. Cite your sources using [Source N] notation
3. If the knowledge base doesn't contain enough information, say so clearly
4. Maintain a professional, helpful tone
5. Structure complex answers with headings and bullet points
6. Indicate confidence level based on source quality and recency
7. Mention if information might be outdated based on the source dates
8. Never fabricate or hallucinate information not in the sources`;

async function processSynthesizeJob(
  job: Job<SynthesizeJobData>,
): Promise<SynthesizeJobResult> {
  const { request } = job.data;
  const startTime = Date.now();

  console.log(`[Synthesize] Processing query: "${request.query.slice(0, 80)}..."`);

  // Step 1: Analyze the query using Haiku
  const analysis = await analyzeQuery(request.query);

  // Step 2: Retrieve relevant knowledge
  const retrievalStart = Date.now();
  const knowledge = await retrieveKnowledge(
    request.org_id,
    analysis,
    request.filters,
    request.max_results ?? 20,
  );
  const retrievalTimeMs = Date.now() - retrievalStart;

  // Step 3: Synthesize answer using Sonnet
  const synthesisStart = Date.now();
  const { answer, confidence, relatedQuestions } = await synthesizeAnswer(
    request.query,
    analysis,
    knowledge,
  );
  const synthesisTimeMs = Date.now() - synthesisStart;

  // Build sources
  const sources: QuerySource[] = knowledge.map((k, i) => ({
    knowledge_unit_id: k.id,
    title: k.title,
    content_snippet: k.content.slice(0, 200),
    relevance_score: k.fusedScore,
    confidence: k.confidence_score >= 0.8 ? 'high' : k.confidence_score >= 0.5 ? 'medium' : 'low',
    last_confirmed_at: k.last_confirmed_at,
  }));

  const response: QueryResponse = {
    answer,
    confidence,
    sources,
    knowledge_units_used: knowledge.map((k) => k.id),
    related_questions: request.include_related ? relatedQuestions : [],
    metadata: {
      retrieval_time_ms: retrievalTimeMs,
      synthesis_time_ms: synthesisTimeMs,
      tokens_used: estimateTokenCount(answer),
    },
  };

  console.log(
    `[Synthesize] Query answered in ${Date.now() - startTime}ms using ${knowledge.length} sources`,
  );

  return { response };
}

/**
 * Analyze the query to determine its type, intent, and relevant categories.
 */
async function analyzeQuery(query: string): Promise<QueryAnalysis> {
  const prompt = `Analyze the following query and determine:
1. Query type: factual, procedural, exploratory, comparative, or temporal
2. User's intent in 1-2 sentences
3. Key entities mentioned
4. Relevant knowledge categories
5. Temporal scope: current, historical, or any
6. A reformulated version of the query optimized for search

Query: "${query}"

Return a JSON object:
{
  "query_type": "factual" | "procedural" | "exploratory" | "comparative" | "temporal",
  "intent": "description of intent",
  "entities": ["entity1", "entity2"],
  "categories": ["engineering", "product", ...],
  "temporal_scope": "current" | "historical" | "any",
  "reformulated_query": "optimized search query"
}`;

  try {
    const response = await chatHaiku(
      [{ role: 'user', content: prompt }],
      { maxTokens: 512, temperature: 0 },
    );

    const parsed = parseJsonResponse<Omit<QueryAnalysis, 'original_query'>>(response);

    return {
      original_query: query,
      ...parsed,
    };
  } catch {
    // Fallback analysis
    return {
      original_query: query,
      query_type: 'factual',
      intent: query,
      entities: [],
      categories: ['general'] as KnowledgeCategory[],
      temporal_scope: 'any',
      reformulated_query: query,
    };
  }
}

interface ScoredKnowledge {
  id: string;
  title: string;
  content: string;
  similarity: number;
  confidence_score: number;
  type: string;
  category: string;
  fusedScore: number;
  last_confirmed_at: string | null;
}

/**
 * Retrieve relevant knowledge using both vector similarity and keyword search,
 * combined with Reciprocal Rank Fusion (RRF).
 */
async function retrieveKnowledge(
  orgId: string,
  analysis: QueryAnalysis,
  filters: QueryRequest['filters'],
  maxResults: number,
): Promise<ScoredKnowledge[]> {
  // Run vector search and keyword search in parallel
  const [vectorResults, keywordResults] = await Promise.all([
    // Vector similarity search
    searchSimilar(orgId, analysis.reformulated_query, {
      threshold: 0.6,
      limit: maxResults * 2,
      categories: filters?.categories,
      types: filters?.types,
    }),
    // Keyword search via Supabase full-text search
    keywordSearch(orgId, analysis.reformulated_query, maxResults * 2, filters),
  ]);

  // Apply Reciprocal Rank Fusion
  const fusedResults = reciprocalRankFusion(
    vectorResults.map((r) => ({ ...r, last_confirmed_at: null, fusedScore: 0 })),
    keywordResults,
    60, // k parameter for RRF
  );

  // Sort by fused score and limit
  return fusedResults
    .sort((a, b) => b.fusedScore - a.fusedScore)
    .slice(0, maxResults);
}

/**
 * Keyword search using Supabase full-text search.
 */
async function keywordSearch(
  orgId: string,
  query: string,
  limit: number,
  filters?: QueryRequest['filters'],
): Promise<ScoredKnowledge[]> {
  const sb = getSupabaseClient();

  let queryBuilder = sb
    .from('knowledge_units')
    .select('id, title, content, confidence_score, type, category, last_confirmed_at')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .textSearch('content', query.split(' ').join(' & '), {
      type: 'websearch',
    })
    .limit(limit);

  if (filters?.categories && filters.categories.length > 0) {
    queryBuilder = queryBuilder.in('category', filters.categories);
  }

  if (filters?.types && filters.types.length > 0) {
    queryBuilder = queryBuilder.in('type', filters.types);
  }

  if (filters?.min_confidence) {
    queryBuilder = queryBuilder.gte(
      'confidence_score',
      filters.min_confidence,
    );
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.warn('[Synthesize] Keyword search failed:', error.message);
    return [];
  }

  return (data ?? []).map((d, i) => ({
    id: d.id,
    title: d.title,
    content: d.content,
    similarity: 1 - i * 0.02, // Approximate rank-based score
    confidence_score: d.confidence_score,
    type: d.type,
    category: d.category,
    fusedScore: 0,
    last_confirmed_at: d.last_confirmed_at,
  }));
}

/**
 * Reciprocal Rank Fusion: combines rankings from multiple retrieval methods.
 * RRF score = sum(1 / (k + rank_i)) for each method i
 */
function reciprocalRankFusion(
  vectorResults: ScoredKnowledge[],
  keywordResults: ScoredKnowledge[],
  k: number = 60,
): ScoredKnowledge[] {
  const scoreMap = new Map<string, ScoredKnowledge>();

  // Score vector results
  vectorResults.forEach((result, rank) => {
    const score = 1 / (k + rank + 1);
    const existing = scoreMap.get(result.id);
    if (existing) {
      existing.fusedScore += score;
    } else {
      scoreMap.set(result.id, { ...result, fusedScore: score });
    }
  });

  // Score keyword results
  keywordResults.forEach((result, rank) => {
    const score = 1 / (k + rank + 1);
    const existing = scoreMap.get(result.id);
    if (existing) {
      existing.fusedScore += score;
    } else {
      scoreMap.set(result.id, { ...result, fusedScore: score });
    }
  });

  return Array.from(scoreMap.values());
}

/**
 * Synthesize an answer from the retrieved knowledge using Sonnet.
 */
async function synthesizeAnswer(
  query: string,
  analysis: QueryAnalysis,
  knowledge: ScoredKnowledge[],
): Promise<{
  answer: string;
  confidence: number;
  relatedQuestions: string[];
}> {
  if (knowledge.length === 0) {
    return {
      answer:
        "I don't have enough information in the knowledge base to answer this question. This topic may not have been covered in the connected sources yet.",
      confidence: 0,
      relatedQuestions: [],
    };
  }

  const sourcesText = knowledge
    .map(
      (k, i) =>
        `[Source ${i + 1}] (${k.type}, confidence: ${k.confidence_score.toFixed(2)})\nTitle: ${k.title}\nContent: ${k.content}`,
    )
    .join('\n\n---\n\n');

  const prompt = `Answer the following question using ONLY the provided sources.

Question: ${query}
Query Analysis: ${JSON.stringify(analysis)}

Sources:
${sourcesText}

Instructions:
1. Synthesize a comprehensive answer citing sources as [Source N]
2. Rate your overall confidence (0-1) based on source quality, relevance, and recency
3. Suggest 2-3 related follow-up questions

Return a JSON object:
{
  "answer": "Your synthesized answer with [Source N] citations",
  "confidence": 0.0 to 1.0,
  "related_questions": ["question1", "question2", "question3"]
}`;

  try {
    const response = await chatSonnet(
      [{ role: 'user', content: prompt }],
      {
        system: SYNTHESIZE_SYSTEM_PROMPT,
        maxTokens: 4096,
        temperature: 0.1,
      },
    );

    const parsed = parseJsonResponse<{
      answer: string;
      confidence: number;
      related_questions: string[];
    }>(response);

    return {
      answer: parsed.answer,
      confidence: parsed.confidence,
      relatedQuestions: parsed.related_questions || [],
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Synthesize] Answer synthesis failed:', message);
    return {
      answer:
        'I encountered an error while synthesizing the answer. Please try again.',
      confidence: 0,
      relatedQuestions: [],
    };
  }
}

export function getSynthesizeQueue(): Queue<SynthesizeJobData> {
  return new Queue<SynthesizeJobData>(SYNTHESIZE_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'fixed', delay: 5000 },
      removeOnComplete: 500,
      removeOnFail: 100,
    },
  });
}

export function createSynthesizeWorker(): Worker<SynthesizeJobData> {
  const worker = new Worker<SynthesizeJobData>(
    SYNTHESIZE_QUEUE_NAME,
    processSynthesizeJob,
    {
      connection: createRedisConnection(),
      concurrency: 5,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[Synthesize] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Synthesize] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
