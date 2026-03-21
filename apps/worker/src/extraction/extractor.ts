import { z } from 'zod';
import type { RawEvent, ExtractedFact } from '@tribemem/shared';
import { chatHaiku, parseJsonResponse } from '../lib/anthropic';
import { splitIntoChunks, estimateTokenCount } from '../lib/tokens';
import {
  EXTRACT_FACTS_SYSTEM_PROMPT,
  EXTRACT_FACTS_USER_PROMPT,
} from './prompts/extract-facts';
import {
  EXTRACT_PROCESSES_SYSTEM_PROMPT,
  EXTRACT_PROCESSES_USER_PROMPT,
} from './prompts/extract-processes';
import {
  EXTRACT_DECISIONS_SYSTEM_PROMPT,
  EXTRACT_DECISIONS_USER_PROMPT,
} from './prompts/extract-decisions';

// ---------------------------------------------------------------------------
// Validation schema for extracted facts
// ---------------------------------------------------------------------------

const ExtractedEntitySchema = z.object({
  name: z.string(),
  type: z.enum([
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
  ]),
  role: z.string(),
});

const ExtractedFactSchema = z.object({
  type: z.enum(['fact', 'process', 'decision', 'norm', 'definition']),
  title: z.string().max(200),
  content: z.string(),
  category: z.enum([
    'engineering',
    'support',
    'hr',
    'finance',
    'product',
    'operations',
    'sales',
    'general',
  ]),
  confidence: z.enum(['high', 'medium', 'low']),
  entities: z.array(ExtractedEntitySchema),
  temporal_context: z.enum(['current', 'historical', 'planned']),
  tags: z.array(z.string()),
});

const ExtractedFactsArraySchema = z.array(ExtractedFactSchema);

// Max tokens to send per extraction call (leave room for system prompt + response)
const MAX_INPUT_TOKENS = 6000;
const BATCH_SIZE = 20;

/**
 * Extract knowledge facts from a batch of raw events.
 */
export async function extractFacts(
  events: RawEvent[],
): Promise<ExtractedFact[]> {
  if (events.length === 0) return [];

  // Batch events to stay within token limits
  const batches = batchEvents(events, BATCH_SIZE, MAX_INPUT_TOKENS);
  const allFacts: ExtractedFact[] = [];

  for (const batch of batches) {
    const eventsText = batch
      .map(
        (e) =>
          `[${e.connector_type}] [${e.occurred_at}] ${e.content}`,
      )
      .join('\n\n---\n\n');

    // Run all extraction passes in parallel
    const [facts, processes, decisions] = await Promise.all([
      extractWithPrompt(
        EXTRACT_FACTS_SYSTEM_PROMPT,
        EXTRACT_FACTS_USER_PROMPT,
        eventsText,
      ),
      extractWithPrompt(
        EXTRACT_PROCESSES_SYSTEM_PROMPT,
        EXTRACT_PROCESSES_USER_PROMPT,
        eventsText,
      ),
      extractWithPrompt(
        EXTRACT_DECISIONS_SYSTEM_PROMPT,
        EXTRACT_DECISIONS_USER_PROMPT,
        eventsText,
      ),
    ]);

    allFacts.push(...facts, ...processes, ...decisions);
  }

  return allFacts;
}

/**
 * Run a single extraction pass with a given prompt pair.
 */
async function extractWithPrompt(
  systemPrompt: string,
  userPromptTemplate: string,
  eventsText: string,
): Promise<ExtractedFact[]> {
  // If content is too large, split into chunks
  const chunks = splitIntoChunks(eventsText, MAX_INPUT_TOKENS, 200);
  const allFacts: ExtractedFact[] = [];

  for (const chunk of chunks) {
    const userPrompt = userPromptTemplate.replace('{{EVENTS}}', chunk);

    try {
      const response = await chatHaiku(
        [{ role: 'user', content: userPrompt }],
        {
          system: systemPrompt,
          maxTokens: 4096,
          temperature: 0,
        },
      );

      const parsed = parseJsonResponse<unknown[]>(response);
      const validated = ExtractedFactsArraySchema.safeParse(parsed);

      if (validated.success) {
        allFacts.push(...(validated.data as ExtractedFact[]));
      } else {
        console.warn(
          '[Extractor] Validation failed for extraction response:',
          validated.error.issues.slice(0, 3),
        );

        // Try to salvage individual facts
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const singleResult = ExtractedFactSchema.safeParse(item);
            if (singleResult.success) {
              allFacts.push(singleResult.data as ExtractedFact);
            }
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Extractor] Extraction call failed:', message);
      // Continue with other chunks; don't fail the entire batch
    }
  }

  return allFacts;
}

/**
 * Split events into batches that fit within token limits.
 */
function batchEvents(
  events: RawEvent[],
  maxBatchSize: number,
  maxTokens: number,
): RawEvent[][] {
  const batches: RawEvent[][] = [];
  let currentBatch: RawEvent[] = [];
  let currentTokens = 0;

  for (const event of events) {
    const eventTokens = estimateTokenCount(event.content);

    if (
      currentBatch.length >= maxBatchSize ||
      (currentTokens + eventTokens > maxTokens && currentBatch.length > 0)
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentTokens = 0;
    }

    currentBatch.push(event);
    currentTokens += eventTokens;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}
