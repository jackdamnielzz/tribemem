import { Queue } from 'bullmq';
import { getRedisConnection } from '../lib/redis';

export const CRAWL_QUEUE_NAME = 'crawl';

export interface CrawlJobData {
  connectorId: string;
  orgId: string;
}

let crawlQueue: Queue<CrawlJobData> | null = null;

export function getCrawlQueue(): Queue<CrawlJobData> {
  if (crawlQueue) return crawlQueue;

  crawlQueue = new Queue<CrawlJobData>(CRAWL_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  });

  return crawlQueue;
}

export async function enqueueCrawlJob(data: CrawlJobData): Promise<string> {
  const queue = getCrawlQueue();
  const job = await queue.add('crawl', data, {
    jobId: `crawl:${data.connectorId}:${Date.now()}`,
  });
  return job.id ?? '';
}
