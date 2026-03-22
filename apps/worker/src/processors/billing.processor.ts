import { Worker, Queue, type Job } from 'bullmq';
import { createRedisConnection, getRedisConnection } from '../lib/redis';
import { getSupabaseClient } from '../lib/supabase';

const BILLING_QUEUE_NAME = 'billing';

interface BillingJobData {
  task: 'reset_usage' | 'check_grace_period';
}

// ---------------------------------------------------------------------------
// Job processor
// ---------------------------------------------------------------------------

async function processBillingJob(job: Job<BillingJobData>): Promise<void> {
  switch (job.data.task) {
    case 'reset_usage':
      await resetExpiredUsagePeriods();
      break;
    case 'check_grace_period':
      await checkGracePeriodExpiry();
      break;
    default:
      console.warn(`[Billing] Unknown task: ${job.data.task}`);
  }
}

// ---------------------------------------------------------------------------
// Usage reset: runs hourly, resets counters for orgs past their usage_reset_at
// ---------------------------------------------------------------------------

async function resetExpiredUsagePeriods(): Promise<void> {
  const sb = getSupabaseClient();

  // Find all orgs whose usage period has expired
  const { data: orgs, error } = await sb
    .from('organizations')
    .select('id, plan, usage_reset_at')
    .lte('usage_reset_at', new Date().toISOString());

  if (error) {
    console.error('[Billing] Failed to query expired usage periods:', error.message);
    return;
  }

  if (!orgs || orgs.length === 0) {
    console.log('[Billing] No expired usage periods to reset');
    return;
  }

  console.log(`[Billing] Resetting usage for ${orgs.length} org(s)`);

  for (const org of orgs) {
    // Reset usage counters and set next reset date (30 days from now)
    const nextReset = new Date();
    nextReset.setDate(nextReset.getDate() + 30);

    const { error: updateError } = await sb
      .from('organizations')
      .update({
        usage_this_period: {
          crawl_events: 0,
          extractions: 0,
          queries: 0,
          api_calls: 0,
          tokens_used: 0,
        },
        usage_reset_at: nextReset.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', org.id);

    if (updateError) {
      console.error(`[Billing] Failed to reset usage for org ${org.id}:`, updateError.message);
    } else {
      console.log(`[Billing] Reset usage for org ${org.id}, next reset: ${nextReset.toISOString()}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Grace period: runs hourly, auto-downgrades orgs 7 days after payment failure
// ---------------------------------------------------------------------------

const GRACE_PERIOD_DAYS = 7;

async function checkGracePeriodExpiry(): Promise<void> {
  const sb = getSupabaseClient();

  // Find orgs with a payment_failed alert older than 7 days that are still on a paid plan
  const graceCutoff = new Date();
  graceCutoff.setDate(graceCutoff.getDate() - GRACE_PERIOD_DAYS);

  // Find open payment_failed alerts older than grace period
  const { data: expiredAlerts, error } = await sb
    .from('alerts')
    .select('org_id')
    .eq('type', 'payment_failed')
    .eq('status', 'open')
    .lte('created_at', graceCutoff.toISOString());

  if (error) {
    console.error('[Billing] Failed to query grace period alerts:', error.message);
    return;
  }

  if (!expiredAlerts || expiredAlerts.length === 0) {
    console.log('[Billing] No expired grace periods');
    return;
  }

  // Deduplicate org IDs
  const orgIds = [...new Set(expiredAlerts.map((a) => a.org_id as string))];

  console.log(`[Billing] Checking grace period for ${orgIds.length} org(s)`);

  for (const orgId of orgIds) {
    // Verify the org is still on a paid plan
    const { data: org, error: orgError } = await sb
      .from('organizations')
      .select('id, plan, stripe_subscription_id')
      .eq('id', orgId)
      .single();

    if (orgError || !org || org.plan === 'free') continue;

    console.log(`[Billing] Grace period expired for org ${orgId}, downgrading from ${org.plan} to free`);

    // Downgrade to free
    const { error: updateError } = await sb
      .from('organizations')
      .update({
        plan: 'free',
        stripe_subscription_id: null,
        usage_this_period: {
          crawl_events: 0,
          extractions: 0,
          queries: 0,
          api_calls: 0,
          tokens_used: 0,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId);

    if (updateError) {
      console.error(`[Billing] Failed to downgrade org ${orgId}:`, updateError.message);
      continue;
    }

    // Record billing event
    await sb.from('billing_events').insert({
      org_id: orgId,
      event_type: 'subscription_cancelled',
      amount_cents: 0,
      currency: 'eur',
      description: `Auto-downgraded to free after ${GRACE_PERIOD_DAYS}-day grace period (payment failure)`,
      metadata: { reason: 'grace_period_expired', previous_plan: org.plan },
    });

    // Close the payment_failed alerts for this org
    await sb
      .from('alerts')
      .update({ status: 'resolved', resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('org_id', orgId)
      .eq('type', 'payment_failed')
      .eq('status', 'open');

    // Create a new alert informing the org of the downgrade
    await sb.from('alerts').insert({
      org_id: orgId,
      type: 'system',
      severity: 'critical',
      status: 'open',
      title: 'Subscription cancelled — downgraded to Free',
      description: `Your subscription was cancelled after ${GRACE_PERIOD_DAYS} days of unsuccessful payment. Your organization has been downgraded to the Free plan. Please update your payment method and resubscribe to restore access.`,
      related_entity_ids: [],
      details: { reason: 'grace_period_expired', previous_plan: org.plan },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    console.log(`[Billing] Org ${orgId} downgraded to free and notified`);
  }
}

// ---------------------------------------------------------------------------
// Queue and worker setup
// ---------------------------------------------------------------------------

let billingQueue: Queue<BillingJobData> | null = null;

export function getBillingQueue(): Queue<BillingJobData> {
  if (billingQueue) return billingQueue;

  const queue = new Queue<BillingJobData>(BILLING_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: 50,
      removeOnFail: 20,
    },
  });

  billingQueue = queue;
  return queue;
}

/**
 * Schedule the recurring billing jobs (usage reset + grace period check).
 * Uses BullMQ repeatable jobs — safe to call multiple times (idempotent by jobId).
 */
export async function scheduleBillingJobs(): Promise<void> {
  const queue = getBillingQueue();

  // Run usage reset every hour at minute 0
  await queue.add('billing', { task: 'reset_usage' }, {
    repeat: { pattern: '0 * * * *' },
    jobId: 'billing:reset_usage',
  });

  // Run grace period check every hour at minute 30
  await queue.add('billing', { task: 'check_grace_period' }, {
    repeat: { pattern: '30 * * * *' },
    jobId: 'billing:check_grace_period',
  });

  console.log('[Billing] Scheduled repeatable jobs: reset_usage (hourly :00), check_grace_period (hourly :30)');
}

export function createBillingWorker(): Worker<BillingJobData> {
  const worker = new Worker<BillingJobData>(
    BILLING_QUEUE_NAME,
    processBillingJob,
    {
      connection: createRedisConnection(),
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[Billing] Job ${job.id} (${job.data.task}) completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Billing] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
