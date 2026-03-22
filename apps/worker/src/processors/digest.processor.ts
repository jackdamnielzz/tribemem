import { Worker, Queue, type Job } from 'bullmq';
import { createRedisConnection, getRedisConnection } from '../lib/redis';
import { getSupabaseClient } from '../lib/supabase';
import { sendEmail } from '../lib/email';

const DIGEST_QUEUE_NAME = 'digest';

interface DigestJobData {
  task: 'weekly_digest';
}

// ---------------------------------------------------------------------------
// Weekly digest: sends activity summary to org owners every Monday at 9am UTC
// ---------------------------------------------------------------------------

async function processDigestJob(job: Job<DigestJobData>): Promise<void> {
  if (job.data.task !== 'weekly_digest') {
    console.warn(`[Digest] Unknown task: ${job.data.task}`);
    return;
  }

  const sb = getSupabaseClient();

  // Get all orgs with their owner emails
  const { data: orgs, error } = await sb
    .from('organizations')
    .select('id, name, usage_this_period');

  if (error) {
    console.error('[Digest] Failed to query organizations:', error.message);
    return;
  }

  if (!orgs || orgs.length === 0) return;

  console.log(`[Digest] Sending weekly digest for ${orgs.length} org(s)`);

  for (const org of orgs) {
    // Get org owner email
    const { data: owner } = await sb
      .from('members')
      .select('email')
      .eq('organization_id', org.id)
      .eq('role', 'owner')
      .limit(1)
      .single();

    if (!owner?.email) continue;

    // Get stats for the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { count: knowledgeCount } = await sb
      .from('knowledge_units')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .gte('created_at', weekAgo.toISOString());

    const { count: queryCount } = await sb
      .from('queries')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .gte('created_at', weekAgo.toISOString());

    const { count: memberCount } = await sb
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id);

    const { count: sourceCount } = await sb
      .from('raw_events')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .gte('ingested_at', weekAgo.toISOString());

    const stats = {
      knowledgeUnitsAdded: knowledgeCount ?? 0,
      sourcesProcessed: sourceCount ?? 0,
      queriesAnswered: queryCount ?? 0,
      activeMembers: memberCount ?? 0,
    };

    // Only send if there was any activity
    if (stats.knowledgeUnitsAdded === 0 && stats.queriesAnswered === 0 && stats.sourcesProcessed === 0) {
      continue;
    }

    const html = `
      <div style="font-family: sans-serif; background: #0f0f0f; color: #e0e0e0; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 8px; padding: 32px;">
          <strong style="color: #fff; font-size: 18px;">TribeMem</strong>
          <h1 style="color: #fff; font-size: 24px; margin: 24px 0 8px;">Weekly Digest</h1>
          <p style="font-size: 15px; line-height: 1.6;">
            Here's what happened in <strong style="color: #fff;">${org.name}</strong> this week.
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 24px 0;">
            <div style="background: #262626; padding: 16px; border-radius: 6px;">
              <p style="color: #888; font-size: 12px; margin: 0 0 4px;">Knowledge Units</p>
              <p style="color: #fff; font-size: 28px; font-weight: 700; margin: 0;">${stats.knowledgeUnitsAdded}</p>
            </div>
            <div style="background: #262626; padding: 16px; border-radius: 6px;">
              <p style="color: #888; font-size: 12px; margin: 0 0 4px;">Sources Processed</p>
              <p style="color: #fff; font-size: 28px; font-weight: 700; margin: 0;">${stats.sourcesProcessed}</p>
            </div>
            <div style="background: #262626; padding: 16px; border-radius: 6px;">
              <p style="color: #888; font-size: 12px; margin: 0 0 4px;">Queries Answered</p>
              <p style="color: #fff; font-size: 28px; font-weight: 700; margin: 0;">${stats.queriesAnswered}</p>
            </div>
            <div style="background: #262626; padding: 16px; border-radius: 6px;">
              <p style="color: #888; font-size: 12px; margin: 0 0 4px;">Team Members</p>
              <p style="color: #fff; font-size: 28px; font-weight: 700; margin: 0;">${stats.activeMembers}</p>
            </div>
          </div>
          <a href="https://tribemem.com/overview" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;">View Dashboard</a>
          <hr style="border: none; border-top: 1px solid #2a2a2a; margin: 24px 0;" />
          <p style="color: #888; font-size: 13px;">&copy; TribeMem</p>
        </div>
      </div>`;

    await sendEmail(
      owner.email,
      `Your weekly TribeMem digest for ${org.name}`,
      html,
    );

    console.log(`[Digest] Sent weekly digest to ${owner.email} for org ${org.name}`);
  }
}

// ---------------------------------------------------------------------------
// Queue and worker setup
// ---------------------------------------------------------------------------

let digestQueue: Queue<DigestJobData> | null = null;

export function getDigestQueue(): Queue<DigestJobData> {
  if (digestQueue) return digestQueue;

  const queue = new Queue<DigestJobData>(DIGEST_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: 10,
      removeOnFail: 10,
    },
  });

  digestQueue = queue;
  return queue;
}

/**
 * Schedule the weekly digest job.
 * Runs every Monday at 9:00 AM UTC.
 */
export async function scheduleDigestJobs(): Promise<void> {
  const queue = getDigestQueue();

  await queue.add('digest', { task: 'weekly_digest' }, {
    repeat: { pattern: '0 9 * * 1' }, // Every Monday at 9:00 UTC
    jobId: 'digest:weekly',
  });

  console.log('[Digest] Scheduled repeatable job: weekly_digest (Mon 09:00 UTC)');
}

export function createDigestWorker(): Worker<DigestJobData> {
  const worker = new Worker<DigestJobData>(
    DIGEST_QUEUE_NAME,
    processDigestJob,
    {
      connection: createRedisConnection(),
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[Digest] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Digest] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
