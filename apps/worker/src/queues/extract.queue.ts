import { Queue } from 'bullmq';
import { getRedisConnection } from '../lib/redis';

export const EXTRACT_QUEUE_NAME = 'extract';

export interface ExtractJobData {
  orgId: string;
  rawEventIds: string[];
  connectorType: string;
}

let extractQueue: Queue<ExtractJobData> | null = null;

export function getExtractQueue(): Queue<ExtractJobData> {
  if (extractQueue) return extractQueue;

  const queue = new Queue<ExtractJobData>(EXTRACT_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 10_000,
      },
      removeOnComplete: 200,
      removeOnFail: 100,
    },
  });

  extractQueue = queue;
  return queue;
}

/** Default concurrency limit for extract workers. */
export const EXTRACT_CONCURRENCY = 5;

export async function enqueueExtractJob(data: ExtractJobData): Promise<string> {
  const queue = getExtractQueue();
  const job = await queue.add('extract', data);
  return job.id ?? '';
}

/**
 * Enqueue an extract job with a specific concurrency group.
 * Jobs sharing the same group key will be limited to EXTRACT_CONCURRENCY.
 */
export async function enqueueExtractJobWithGroup(
  data: ExtractJobData,
  groupKey: string,
): Promise<string> {
  const queue = getExtractQueue();
  const job = await queue.add('extract', data, {
    jobId: `extract:${groupKey}:${Date.now()}`,
  });
  return job.id ?? '';
}
