import { Queue } from 'bullmq';
import { getRedisConnection } from '../lib/redis';

export const SYNC_QUEUE_NAME = 'sync';

export interface SyncJobData {
  connectorId?: string;
  connectorType: string;
  orgId: string;
  webhookPayload?: unknown;
}

let syncQueue: Queue<SyncJobData> | null = null;

export function getSyncQueue(): Queue<SyncJobData> {
  if (syncQueue) return syncQueue;

  const queue = new Queue<SyncJobData>(SYNC_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 10_000,
      },
      removeOnComplete: 50,
      removeOnFail: 20,
    },
  });

  syncQueue = queue;
  return queue;
}

/**
 * Add a repeatable sync job for a connector.
 * @param connectorId - The connector to sync
 * @param orgId - The organization ID
 * @param intervalMs - Repeat interval in milliseconds (default: 15 minutes)
 */
export async function addRepeatableSync(
  connectorId: string,
  orgId: string,
  intervalMs: number = 15 * 60 * 1000,
): Promise<void> {
  const queue = getSyncQueue();
  await queue.add(
    'sync',
    { connectorId, connectorType: '', orgId },
    {
      repeat: {
        every: intervalMs,
      },
      jobId: `sync:${connectorId}`,
    },
  );
}

/**
 * Enqueue a sync job with default priority.
 */
export async function enqueueSyncJob(data: SyncJobData): Promise<string> {
  const queue = getSyncQueue();
  const job = await queue.add('sync', data, {
    jobId: `sync:${data.connectorType}:${data.orgId}:${Date.now()}`,
  });
  return job.id ?? '';
}

/**
 * Enqueue a webhook-triggered sync job with high priority.
 * Webhooks use priority 1 (highest) to ensure they are processed before
 * scheduled syncs which use the default priority.
 */
export async function enqueueWebhookSyncJob(data: SyncJobData): Promise<string> {
  const queue = getSyncQueue();
  const job = await queue.add('sync', data, {
    priority: 1,
    jobId: `sync:webhook:${data.connectorType}:${data.orgId}:${Date.now()}`,
  });
  return job.id ?? '';
}

/**
 * Remove a repeatable sync job for a connector.
 */
export async function removeRepeatableSync(connectorId: string): Promise<void> {
  const queue = getSyncQueue();
  const repeatableJobs = await queue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.id === `sync:${connectorId}`) {
      await queue.removeRepeatableByKey(job.key);
    }
  }
}
