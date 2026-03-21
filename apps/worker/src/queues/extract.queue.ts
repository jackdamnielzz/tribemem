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

  extractQueue = new Queue<ExtractJobData>(EXTRACT_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 10_000,
      },
      removeOnComplete: 200,
      removeOnFail: 100,
    },
  });

  return extractQueue;
}

export async function enqueueExtractJob(data: ExtractJobData): Promise<string> {
  const queue = getExtractQueue();
  const job = await queue.add('extract', data, {
    rateLimiter: {
      max: 10,
      duration: 1000,
    },
  });
  return job.id ?? '';
}
