import { Queue } from 'bullmq';
import { getRedisConnection } from '../lib/redis';

export const SYNC_QUEUE_NAME = 'sync';

export interface SyncJobData {
  connectorId: string;
  orgId: string;
}

let syncQueue: Queue<SyncJobData> | null = null;

export function getSyncQueue(): Queue<SyncJobData> {
  if (syncQueue) return syncQueue;

  syncQueue = new Queue<SyncJobData>(SYNC_QUEUE_NAME, {
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

  return syncQueue;
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
    { connectorId, orgId },
    {
      repeat: {
        every: intervalMs,
      },
      jobId: `sync:${connectorId}`,
    },
  );
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
