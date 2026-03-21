import { Worker, type Job, Queue } from 'bullmq';
import { v4 as uuid } from 'uuid';
import { createRedisConnection, getRedisConnection } from '../lib/redis';
import { insertAlert, getSupabaseClient } from '../lib/supabase';
import type { AlertType, AlertSeverity } from '@tribemem/shared';

const ALERT_QUEUE_NAME = 'alert';

export interface AlertJobData {
  orgId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  relatedEntityIds: string[];
  details: Record<string, unknown>;
}

async function processAlertJob(job: Job<AlertJobData>): Promise<void> {
  const { orgId, type, severity, title, description, relatedEntityIds, details } =
    job.data;

  console.log(`[Alert] Creating alert: ${type} - ${title}`);

  // Check alert rules / cooldowns
  const shouldCreate = await checkAlertRules(orgId, type, severity);
  if (!shouldCreate) {
    console.log(`[Alert] Suppressed by cooldown rule: ${type}`);
    return;
  }

  // Create alert record in DB
  const alertId = await insertAlert({
    id: uuid(),
    org_id: orgId,
    type,
    severity,
    status: 'open',
    title,
    description,
    related_entity_ids: relatedEntityIds,
    details,
    acknowledged_by: null,
    acknowledged_at: null,
    resolved_by: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  console.log(`[Alert] Created alert ${alertId}: ${type} (${severity})`);

  // Future: send notifications via configured channels
  await sendNotifications(orgId, type, severity, title, description);
}

/**
 * Check alert rules to determine if this alert should be created.
 * Respects cooldown periods to avoid flooding.
 */
async function checkAlertRules(
  orgId: string,
  type: AlertType,
  severity: AlertSeverity,
): Promise<boolean> {
  const sb = getSupabaseClient();

  // Check if there's an alert rule for this type
  const { data: rules } = await sb
    .from('alert_rules')
    .select('*')
    .eq('org_id', orgId)
    .eq('type', type)
    .eq('enabled', true)
    .limit(1);

  if (!rules || rules.length === 0) {
    // No rule configured; allow alert by default
    return true;
  }

  const rule = rules[0]!;
  const cooldownMinutes = rule.cooldown_minutes as number;

  if (cooldownMinutes > 0) {
    // Check if a similar alert was created recently
    const cooldownCutoff = new Date(
      Date.now() - cooldownMinutes * 60 * 1000,
    ).toISOString();

    const { data: recentAlerts } = await sb
      .from('alerts')
      .select('id')
      .eq('org_id', orgId)
      .eq('type', type)
      .gte('created_at', cooldownCutoff)
      .limit(1);

    if (recentAlerts && recentAlerts.length > 0) {
      return false; // Still in cooldown
    }
  }

  return true;
}

/**
 * Send notifications for an alert via configured channels.
 * Currently a stub for future Resend/email integration.
 */
async function sendNotifications(
  orgId: string,
  type: AlertType,
  severity: AlertSeverity,
  title: string,
  description: string,
): Promise<void> {
  const sb = getSupabaseClient();

  // Fetch alert rules for notification channels
  const { data: rules } = await sb
    .from('alert_rules')
    .select('notify_channels')
    .eq('org_id', orgId)
    .eq('type', type)
    .eq('enabled', true)
    .limit(1);

  if (!rules || rules.length === 0) return;

  const channels = (rules[0]!.notify_channels as string[]) || [];

  for (const channel of channels) {
    switch (channel) {
      case 'email': {
        // TODO: Implement email notifications via Resend
        // const org = await getOrgById(orgId);
        // if (org.settings.notification_email) {
        //   await resend.emails.send({
        //     from: 'alerts@tribemem.com',
        //     to: org.settings.notification_email,
        //     subject: `[TribeMem Alert] ${severity.toUpperCase()}: ${title}`,
        //     text: description,
        //   });
        // }
        console.log(`[Alert] Email notification stub for ${orgId}: ${title}`);
        break;
      }
      case 'slack': {
        // TODO: Implement Slack webhook notifications
        console.log(`[Alert] Slack notification stub for ${orgId}: ${title}`);
        break;
      }
      default:
        console.log(`[Alert] Unknown notification channel: ${channel}`);
    }
  }
}

export function getAlertQueue(): Queue<AlertJobData> {
  return new Queue<AlertJobData>(ALERT_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 200,
      removeOnFail: 50,
    },
  });
}

export function createAlertWorker(): Worker<AlertJobData> {
  const worker = new Worker<AlertJobData>(
    ALERT_QUEUE_NAME,
    processAlertJob,
    {
      connection: createRedisConnection(),
      concurrency: 5,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[Alert] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Alert] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
