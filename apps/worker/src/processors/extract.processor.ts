import { Worker, type Job } from 'bullmq';
import { v4 as uuid } from 'uuid';
import { createRedisConnection } from '../lib/redis';
import {
  getRawEventsByIds,
  markRawEventsProcessed,
  insertKnowledgeUnit,
  insertAlert,
  incrementOrgUsage,
} from '../lib/supabase';
import {
  EXTRACT_QUEUE_NAME,
  type ExtractJobData,
} from '../queues/extract.queue';
import { extractFacts } from '../extraction/extractor';
import { checkDuplicate } from '../extraction/deduplicator';
import {
  resolveEntity,
  clearEntityCache,
} from '../extraction/entity-resolver';
import { detectContradictions } from '../extraction/contradiction-detector';
import { generateEmbedding, storeEmbedding } from '../memory/vector';
import { linkKnowledgeToSources } from '../memory/linker';
import { createVersion } from '../memory/temporal';
import type { RawEvent, ExtractedFact } from '@tribemem/shared';

const CONFIDENCE_MAP: Record<string, number> = {
  high: 0.9,
  medium: 0.7,
  low: 0.5,
};

async function processExtractJob(job: Job<ExtractJobData>): Promise<void> {
  const { orgId, rawEventIds, connectorType } = job.data;

  console.log(
    `[Extract] Processing ${rawEventIds.length} events from ${connectorType}`,
  );

  // Load raw events from DB
  const rawEvents = (await getRawEventsByIds(rawEventIds)) as RawEvent[];

  if (rawEvents.length === 0) {
    console.log('[Extract] No events found, skipping');
    return;
  }

  // Batch events by context (thread/ticket/page)
  const batches = batchByContext(rawEvents, connectorType);

  let totalKnowledgeCreated = 0;
  let totalDuplicates = 0;
  let totalContradictions = 0;

  for (const batch of batches) {
    try {
      // Extract facts from the batch
      const facts = await extractFacts(batch);

      for (const fact of facts) {
        // Check deduplication
        const dedup = await checkDuplicate(
          orgId,
          fact,
          batch.map((e) => e.id),
        );

        if (dedup.isDuplicate) {
          totalDuplicates++;
          continue;
        }

        // Resolve entities
        const resolvedEntities: Array<{
          entityId: string;
          isNew: boolean;
        }> = [];
        for (const entity of fact.entities) {
          const resolved = await resolveEntity(orgId, entity);
          resolvedEntities.push(resolved);
        }

        // Check for contradictions
        const contradictions = await detectContradictions(orgId, fact);

        // Create the knowledge unit
        const knowledgeId = await createKnowledgeUnit(orgId, fact, batch);
        totalKnowledgeCreated++;

        // Generate and store embedding
        const embeddingText = `${fact.title}: ${fact.content}`;
        const embedding = await generateEmbedding(embeddingText);
        await storeEmbedding(knowledgeId, embedding);

        // Link to source events
        await linkKnowledgeToSources(knowledgeId, batch);

        // Create initial version record
        await createVersion(
          knowledgeId,
          'created',
          null,
          fact.content,
          'Extracted from raw events',
          'system',
        );

        // Handle contradictions
        for (const contradiction of contradictions) {
          if (contradiction.relationship === 'contradicts') {
            totalContradictions++;

            // Create an alert for the contradiction
            await insertAlert({
              id: uuid(),
              org_id: orgId,
              type: 'contradiction',
              severity: contradiction.confidence > 0.8 ? 'high' : 'medium',
              status: 'open',
              title: `Contradiction detected: ${fact.title}`,
              description: contradiction.reasoning,
              related_entity_ids: [
                knowledgeId,
                contradiction.existing_knowledge_id,
              ],
              details: {
                new_knowledge_id: knowledgeId,
                existing_knowledge_id:
                  contradiction.existing_knowledge_id,
                confidence: contradiction.confidence,
                recommended_action: contradiction.recommended_action,
                merge_suggestion: contradiction.merge_suggestion,
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Extract] Batch processing failed:', message);
      // Continue with other batches
    }
  }

  // Mark raw events as processed
  await markRawEventsProcessed(rawEventIds);

  // Update org usage counters
  await incrementOrgUsage(orgId, 'knowledge_units_count', totalKnowledgeCreated);

  // Clear entity cache for this org
  clearEntityCache();

  console.log(
    `[Extract] Completed: ${totalKnowledgeCreated} knowledge units created, ${totalDuplicates} duplicates, ${totalContradictions} contradictions`,
  );

  await job.updateProgress({
    created: totalKnowledgeCreated,
    duplicates: totalDuplicates,
    contradictions: totalContradictions,
  });
}

/**
 * Create a knowledge unit in the database.
 */
async function createKnowledgeUnit(
  orgId: string,
  fact: ExtractedFact,
  sourceEvents: RawEvent[],
): Promise<string> {
  const now = new Date().toISOString();

  return insertKnowledgeUnit({
    id: uuid(),
    org_id: orgId,
    type: fact.type,
    category: fact.category,
    title: fact.title,
    content: fact.content,
    confidence_score: CONFIDENCE_MAP[fact.confidence] ?? 0.5,
    evidence_count: sourceEvents.length,
    last_confirmed_at: now,
    is_current: true,
    superseded_by: null,
    supersedes: null,
    valid_from: sourceEvents[0]?.occurred_at || now,
    valid_until: null,
    status: 'active',
    tags: fact.tags,
    metadata: {
      temporal_context: fact.temporal_context,
      connector_types: [
        ...new Set(sourceEvents.map((e) => e.connector_type)),
      ],
    },
    created_at: now,
    updated_at: now,
  });
}

/**
 * Batch raw events by their context (thread, ticket, page, etc.).
 */
function batchByContext(
  events: RawEvent[],
  connectorType: string,
): RawEvent[][] {
  const groups = new Map<string, RawEvent[]>();

  for (const event of events) {
    let contextKey: string;

    switch (connectorType) {
      case 'slack': {
        // Group by thread (thread_ts) or channel
        const payload = event.raw_payload as Record<string, unknown>;
        const threadTs = payload.thread_ts as string | undefined;
        const channelId = event.external_id.split(':')[0];
        contextKey = threadTs
          ? `thread:${channelId}:${threadTs}`
          : `channel:${channelId}`;
        break;
      }
      case 'jira':
      case 'linear': {
        // Group by issue
        contextKey = `issue:${event.external_id}`;
        break;
      }
      case 'notion': {
        // Group by page
        contextKey = `page:${event.external_id}`;
        break;
      }
      case 'github': {
        // Group by PR/issue
        contextKey = event.external_id;
        break;
      }
      default: {
        // Default: each event is its own batch
        contextKey = event.id;
        break;
      }
    }

    const existing = groups.get(contextKey) || [];
    existing.push(event);
    groups.set(contextKey, existing);
  }

  return Array.from(groups.values());
}

export function createExtractWorker(): Worker<ExtractJobData> {
  const worker = new Worker<ExtractJobData>(
    EXTRACT_QUEUE_NAME,
    processExtractJob,
    {
      connection: createRedisConnection(),
      concurrency: 2,
      limiter: {
        max: 10,
        duration: 1000,
      },
    },
  );

  worker.on('completed', (job) => {
    console.log(`[Extract] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Extract] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
