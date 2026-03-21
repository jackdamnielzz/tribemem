import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let sharedConnection: Redis | null = null;

/**
 * Returns a shared Redis connection instance.
 * Creates the connection on first call and reuses it thereafter.
 */
export function getRedisConnection(): Redis {
  if (sharedConnection) {
    return sharedConnection;
  }

  sharedConnection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: true,
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });

  sharedConnection.on('connect', () => {
    console.log('[Redis] Connected');
  });

  sharedConnection.on('ready', () => {
    console.log('[Redis] Ready');
  });

  sharedConnection.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  sharedConnection.on('close', () => {
    console.log('[Redis] Connection closed');
  });

  sharedConnection.on('reconnecting', (delay: number) => {
    console.log(`[Redis] Reconnecting in ${delay}ms`);
  });

  return sharedConnection;
}

/**
 * Creates a new Redis connection (for BullMQ workers that need their own connections).
 */
export function createRedisConnection(): Redis {
  return new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });
}

/**
 * Closes the shared Redis connection and any provided connections.
 */
export async function closeRedisConnections(
  ...connections: (Redis | null | undefined)[]
): Promise<void> {
  const toClose = [sharedConnection, ...connections].filter(
    (c): c is Redis => c !== null && c !== undefined,
  );

  await Promise.all(
    toClose.map(async (conn) => {
      try {
        await conn.quit();
      } catch {
        conn.disconnect();
      }
    }),
  );

  sharedConnection = null;
}
