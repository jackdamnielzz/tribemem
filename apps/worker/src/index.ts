import http from 'node:http';
import { getRedisConnection, closeRedisConnections } from './lib/redis';
import { createCrawlWorker } from './processors/crawl.processor';
import { createExtractWorker } from './processors/extract.processor';
import { createSynthesizeWorker } from './processors/synthesize.processor';
import { createAlertWorker } from './processors/alert.processor';
import { createBillingWorker, scheduleBillingJobs } from './processors/billing.processor';
import type { Worker } from 'bullmq';

const PORT = parseInt(process.env.PORT || process.env.WORKER_PORT || '3001', 10);

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('[Worker] Starting TribeMem worker service...');

  // Connect to Redis
  const redis = getRedisConnection();
  await new Promise<void>((resolve, reject) => {
    if (redis.status === 'ready') {
      resolve();
      return;
    }
    redis.once('ready', resolve);
    redis.once('error', reject);
  });

  console.log('[Worker] Redis connected');

  // Initialize all BullMQ workers
  const workers: Worker[] = [
    createCrawlWorker(),
    createExtractWorker(),
    createSynthesizeWorker(),
    createAlertWorker(),
    createBillingWorker(),
  ];

  // Schedule recurring billing jobs (usage reset + grace period check)
  await scheduleBillingJobs();

  console.log(`[Worker] Started ${workers.length} workers: crawl, extract, synthesize, alert, billing`);

  // ---------------------------------------------------------------------------
  // HTTP health check endpoint
  // ---------------------------------------------------------------------------

  const server = http.createServer(async (_req, res) => {
    if (_req.url === '/health' || _req.url === '/') {
      try {
        // Ping Redis to verify connectivity
        await redis.ping();

        const status = {
          status: 'ok',
          uptime: process.uptime(),
          workers: workers.map((w) => ({
            name: w.name,
            running: w.isRunning(),
          })),
          timestamp: new Date().toISOString(),
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status));
      } catch {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Redis unavailable' }));
      }
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(PORT, () => {
    console.log(`[Worker] Health check endpoint listening on port ${PORT}`);
  });

  // ---------------------------------------------------------------------------
  // Graceful shutdown
  // ---------------------------------------------------------------------------

  let shuttingDown = false;

  async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`[Worker] Received ${signal}, shutting down gracefully...`);

    // Close health check server
    server.close();

    // Close all workers (waits for current jobs to finish)
    await Promise.all(
      workers.map(async (w) => {
        try {
          await w.close();
          console.log(`[Worker] ${w.name} worker closed`);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`[Worker] Error closing ${w.name} worker:`, message);
        }
      }),
    );

    // Close Redis connections
    await closeRedisConnections();
    console.log('[Worker] Redis connections closed');

    console.log('[Worker] Shutdown complete');
    process.exit(0);
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle unhandled rejections
  process.on('unhandledRejection', (reason) => {
    console.error('[Worker] Unhandled rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[Worker] Uncaught exception:', err);
    shutdown('uncaughtException').catch(() => process.exit(1));
  });
}

main().catch((err) => {
  console.error('[Worker] Fatal error during startup:', err);
  process.exit(1);
});
