import { getResend } from './resend';
import {
  welcomeEmail,
  inviteEmail,
  crawlerAlertEmail,
  weeklyDigestEmail,
  apiKeyCreatedEmail,
  type WeeklyDigestStats,
} from './templates';

const FROM_ADDRESS = 'TribeMem <notifications@tribemem.com>';

interface SendResult {
  success: boolean;
  id?: string;
  error?: string;
}

async function send(to: string, subject: string, html: string): Promise<SendResult> {
  const resend = getResend();
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not set, skipping email to', to);
    return { success: false, error: 'Email not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Email] Failed to send:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Unexpected error:', message);
    return { success: false, error: message };
  }
}

export async function sendWelcomeEmail(to: string, orgName: string): Promise<SendResult> {
  const { subject, html } = welcomeEmail(orgName);
  return send(to, subject, html);
}

export async function sendInviteEmail(
  to: string,
  orgName: string,
  inviterName: string,
  inviteUrl: string
): Promise<SendResult> {
  const { subject, html } = inviteEmail(orgName, inviterName, inviteUrl);
  return send(to, subject, html);
}

export async function sendAlertEmail(
  to: string,
  alertType: string,
  details: string
): Promise<SendResult> {
  const { subject, html } = crawlerAlertEmail(alertType, details);
  return send(to, subject, html);
}

export async function sendWeeklyDigest(
  to: string,
  orgName: string,
  stats: WeeklyDigestStats
): Promise<SendResult> {
  const { subject, html } = weeklyDigestEmail(orgName, stats);
  return send(to, subject, html);
}

export async function sendApiKeyNotification(
  to: string,
  keyName: string
): Promise<SendResult> {
  const { subject, html } = apiKeyCreatedEmail(keyName);
  return send(to, subject, html);
}
