import { Worker, type Job } from 'bullmq';
import { createRedisConnection } from '../lib/redis';
import {
  getConnectorById,
  updateConnectorStatus,
  insertRawEvents,
  upsertSyncCursor,
  getSyncCursors,
  createCrawlerRun,
  updateCrawlerRun,
} from '../lib/supabase';
import { CRAWL_QUEUE_NAME, type CrawlJobData } from '../queues/crawl.queue';
import { enqueueExtractJob } from '../queues/extract.queue';
import { SlackConnector } from '../connectors/slack.connector';
import { NotionConnector } from '../connectors/notion.connector';
import { JiraConnector } from '../connectors/jira.connector';
import { GitHubConnector } from '../connectors/github.connector';
import { IntercomConnector } from '../connectors/intercom.connector';
import { LinearConnector } from '../connectors/linear.connector';
import { GoogleDriveConnector } from '../connectors/google-drive.connector';
import { HubSpotConnector } from '../connectors/hubspot.connector';
import { StripeConnector } from '../connectors/stripe.connector';
import type { BaseConnector } from '../connectors/base.connector';
import type { Connector, SyncCursor } from '@tribemem/shared';

const connectors: Record<string, BaseConnector> = {
  slack: new SlackConnector(),
  notion: new NotionConnector(),
  jira: new JiraConnector(),
  github: new GitHubConnector(),
  intercom: new IntercomConnector(),
  linear: new LinearConnector(),
  google_drive: new GoogleDriveConnector(),
  hubspot: new HubSpotConnector(),
  stripe: new StripeConnector(),
};

const EXTRACT_BATCH_SIZE = 50;

async function processCrawlJob(job: Job<CrawlJobData>): Promise<void> {
  const { connectorId, orgId } = job.data;

  console.log(`[Crawl] Starting crawl for connector ${connectorId}`);

  // Create crawler run record
  const runId = await createCrawlerRun({
    org_id: orgId,
    connector_id: connectorId,
    connector_type: '', // Will be set below
    status: 'running',
    started_at: new Date().toISOString(),
    events_discovered: 0,
    events_ingested: 0,
    events_failed: 0,
    knowledge_units_created: 0,
    knowledge_units_updated: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  let connector: Connector;

  try {
    // Load connector config from DB
    connector = (await getConnectorById(connectorId)) as Connector;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await updateCrawlerRun(runId, {
      status: 'failed',
      error_message: `Failed to load connector: ${message}`,
      completed_at: new Date().toISOString(),
    });
    throw err;
  }

  // Update crawler run with connector type
  await updateCrawlerRun(runId, { connector_type: connector.type });

  const connectorImpl = connectors[connector.type];
  if (!connectorImpl) {
    const errorMsg = `Unsupported connector type: ${connector.type}`;
    await updateCrawlerRun(runId, {
      status: 'failed',
      error_message: errorMsg,
      completed_at: new Date().toISOString(),
    });
    throw new Error(errorMsg);
  }

  try {
    // Update connector status to syncing
    await updateConnectorStatus(connectorId, 'syncing');

    // Load existing sync cursor
    const cursors = await getSyncCursors(connectorId);
    let currentCursor: SyncCursor | null =
      cursors.length > 0 ? (cursors[0] as SyncCursor) : null;

    let totalIngested = 0;
    let totalDiscovered = 0;
    let hasMore = true;

    while (hasMore) {
      // Fetch events from the connector
      const result = await connectorImpl.fetchEvents(
        connector,
        currentCursor,
      );

      totalDiscovered += result.events.length;

      if (result.events.length > 0) {
        // Insert raw events into DB
        const eventRecords = result.events.map((e) => ({
          id: e.id,
          org_id: e.org_id,
          connector_id: e.connector_id,
          connector_type: e.connector_type,
          external_id: e.external_id,
          event_type: e.event_type,
          author_external_id: e.author_external_id,
          author_name: e.author_name,
          content: e.content,
          raw_payload: e.raw_payload,
          occurred_at: e.occurred_at,
          ingested_at: e.ingested_at,
          processed: false,
        }));

        const insertedIds = await insertRawEvents(eventRecords);
        totalIngested += insertedIds.length;

        // Enqueue extract jobs in batches
        for (let i = 0; i < insertedIds.length; i += EXTRACT_BATCH_SIZE) {
          const batch = insertedIds.slice(i, i + EXTRACT_BATCH_SIZE);
          await enqueueExtractJob({
            orgId,
            rawEventIds: batch,
            connectorType: connector.type,
          });
        }
      }

      // Update sync cursor
      await upsertSyncCursor(
        connectorId,
        result.nextCursor.cursor_type,
        result.nextCursor.cursor_value,
        result.nextCursor.metadata,
      );

      currentCursor = result.nextCursor;
      hasMore = result.hasMore;

      // Report progress
      await job.updateProgress({
        discovered: totalDiscovered,
        ingested: totalIngested,
      });

      // Update crawler run progress
      await updateCrawlerRun(runId, {
        events_discovered: totalDiscovered,
        events_ingested: totalIngested,
        cursor_state: result.nextCursor.metadata,
      });
    }

    // Mark crawl as complete
    await updateCrawlerRun(runId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      events_discovered: totalDiscovered,
      events_ingested: totalIngested,
    });

    // Update connector status
    await updateConnectorStatus(connectorId, 'active', {
      last_sync_at: new Date().toISOString(),
      last_sync_error: null,
      events_processed: connector.events_processed + totalIngested,
    });

    console.log(
      `[Crawl] Completed for connector ${connectorId}: ${totalIngested} events ingested`,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // Update crawler run with error
    await updateCrawlerRun(runId, {
      status: 'failed',
      error_message: message,
      completed_at: new Date().toISOString(),
    });

    // Update connector status to error
    await updateConnectorStatus(connectorId, 'error', {
      last_sync_error: message,
    });

    console.error(`[Crawl] Failed for connector ${connectorId}:`, message);
    throw err;
  }
}

export function createCrawlWorker(): Worker<CrawlJobData> {
  const worker = new Worker<CrawlJobData>(
    CRAWL_QUEUE_NAME,
    processCrawlJob,
    {
      connection: createRedisConnection(),
      concurrency: 3,
      limiter: {
        max: 5,
        duration: 60_000,
      },
    },
  );

  worker.on('completed', (job) => {
    console.log(`[Crawl] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Crawl] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
