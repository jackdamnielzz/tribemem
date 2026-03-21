import { Queue } from 'bullmq';
import { getRedisConnection } from '../lib/redis';

export const CRAWL_QUEUE_NAME = 'crawl';

export interface CrawlJobData {
  connectorId: string;
  orgId: string;
  fullSync?: boolean;
}

let crawlQueue: Queue<CrawlJobData> | null = null;

export function getCrawlQueue(): Queue<CrawlJobData> {
  if (crawlQueue) return crawlQueue;

  const queue = new Queue<CrawlJobData>(CRAWL_QUEUE_NAME, {
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

  crawlQueue = queue;
  return queue;
}

export async function enqueueCrawlJob(data: CrawlJobData): Promise<string> {
  const queue = getCrawlQueue();
  const job = await queue.add('crawl', data, {
    jobId: `crawl:${data.connectorId}:${Date.now()}`,
  });
  return job.id ?? '';
}

/**
 * Add a repeatable crawl job on a cron schedule.
 * @param connectorId - The connector to crawl
 * @param orgId - The organization ID
 * @param cron - Cron expression (e.g. "0 0/6 * * *" for every 6 hours)
 */
export async function addScheduledCrawl(
  connectorId: string,
  orgId: string,
  cron: string,
): Promise<void> {
  const queue = getCrawlQueue();
  await queue.add(
    'crawl',
    { connectorId, orgId, fullSync: false },
    {
      repeat: { pattern: cron },
      jobId: `crawl:scheduled:${connectorId}`,
    },
  );
}

/**
 * Remove a scheduled crawl job for a connector.
 */
export async function removeScheduledCrawl(connectorId: string): Promise<void> {
  const queue = getCrawlQueue();
  const repeatableJobs = await queue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.id === `crawl:scheduled:${connectorId}`) {
      await queue.removeRepeatableByKey(job.key);
    }
  }
}
