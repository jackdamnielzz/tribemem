interface EmailTemplate {
  subject: string;
  html: string;
}

const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #0f0f0f;
  color: #e0e0e0;
`;

const CONTAINER_STYLES = `
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 24px;
  background-color: #1a1a1a;
  border-radius: 8px;
`;

const HEADING_STYLES = `
  color: #ffffff;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 16px 0;
`;

const BUTTON_STYLES = `
  display: inline-block;
  padding: 12px 24px;
  background-color: #6366f1;
  color: #ffffff;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
`;

const MUTED_TEXT_STYLES = `
  color: #888888;
  font-size: 13px;
  margin-top: 32px;
`;

const DIVIDER_STYLES = `
  border: none;
  border-top: 1px solid #2a2a2a;
  margin: 24px 0;
`;

function layout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="${BASE_STYLES}">
  <div style="padding: 24px;">
    <div style="${CONTAINER_STYLES}">
      <div style="margin-bottom: 24px;">
        <strong style="color: #ffffff; font-size: 18px;">TribeMem</strong>
      </div>
      ${content}
      <hr style="${DIVIDER_STYLES}" />
      <p style="${MUTED_TEXT_STYLES}">
        &copy; TribeMem. You received this email because you have an account with us.
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}

export function welcomeEmail(orgName: string): EmailTemplate {
  return {
    subject: `Welcome to TribeMem, ${orgName}!`,
    html: layout(`
      <h1 style="${HEADING_STYLES}">Welcome to TribeMem</h1>
      <p style="color: #e0e0e0; font-size: 15px; line-height: 1.6;">
        Your organization <strong style="color: #ffffff;">${orgName}</strong> is now set up and ready to go.
      </p>
      <p style="color: #e0e0e0; font-size: 15px; line-height: 1.6;">
        Here are a few things to get started:
      </p>
      <ul style="color: #e0e0e0; font-size: 15px; line-height: 1.8; padding-left: 20px;">
        <li>Connect your first knowledge sources</li>
        <li>Invite your team members</li>
        <li>Set up your first crawler</li>
        <li>Generate an API key for integrations</li>
      </ul>
      <div style="margin-top: 24px;">
        <a href="https://app.tribemem.com/dashboard" style="${BUTTON_STYLES}">Go to Dashboard</a>
      </div>
    `),
  };
}

export function inviteEmail(
  orgName: string,
  inviterName: string,
  inviteUrl: string
): EmailTemplate {
  return {
    subject: `${inviterName} invited you to join ${orgName} on TribeMem`,
    html: layout(`
      <h1 style="${HEADING_STYLES}">You've been invited</h1>
      <p style="color: #e0e0e0; font-size: 15px; line-height: 1.6;">
        <strong style="color: #ffffff;">${inviterName}</strong> has invited you to join
        <strong style="color: #ffffff;">${orgName}</strong> on TribeMem.
      </p>
      <p style="color: #e0e0e0; font-size: 15px; line-height: 1.6;">
        TribeMem helps teams capture, organize, and share knowledge effortlessly.
        Click below to accept the invitation and get started.
      </p>
      <div style="margin-top: 24px;">
        <a href="${inviteUrl}" style="${BUTTON_STYLES}">Accept Invitation</a>
      </div>
      <p style="color: #888888; font-size: 13px; margin-top: 16px;">
        If the button doesn't work, copy and paste this link into your browser:<br />
        <a href="${inviteUrl}" style="color: #6366f1; word-break: break-all;">${inviteUrl}</a>
      </p>
    `),
  };
}

export function crawlerAlertEmail(
  alertType: string,
  details: string
): EmailTemplate {
  const alertLabels: Record<string, string> = {
    contradiction: 'Knowledge Contradiction Detected',
    extraction_failure: 'Extraction Failure',
    crawl_error: 'Crawler Error',
  };

  const alertColors: Record<string, string> = {
    contradiction: '#f59e0b',
    extraction_failure: '#ef4444',
    crawl_error: '#ef4444',
  };

  const label = alertLabels[alertType] || 'Crawler Alert';
  const color = alertColors[alertType] || '#f59e0b';

  return {
    subject: `[TribeMem Alert] ${label}`,
    html: layout(`
      <h1 style="${HEADING_STYLES}">${label}</h1>
      <div style="
        background-color: #262626;
        border-left: 4px solid ${color};
        padding: 16px;
        border-radius: 4px;
        margin: 16px 0;
      ">
        <p style="color: ${color}; font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">
          ${alertType.replace(/_/g, ' ').toUpperCase()}
        </p>
        <p style="color: #e0e0e0; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${details}</p>
      </div>
      <div style="margin-top: 24px;">
        <a href="https://app.tribemem.com/dashboard/alerts" style="${BUTTON_STYLES}">View Alerts</a>
      </div>
    `),
  };
}

export interface WeeklyDigestStats {
  knowledgeUnitsAdded: number;
  sourcesProcessed: number;
  queriesAnswered: number;
  activeMembers: number;
  topTopics?: string[];
}

export function weeklyDigestEmail(
  orgName: string,
  stats: WeeklyDigestStats
): EmailTemplate {
  const topTopicsHtml = stats.topTopics?.length
    ? `
      <p style="color: #e0e0e0; font-size: 14px; font-weight: 600; margin: 16px 0 8px 0;">Top Topics</p>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${stats.topTopics
          .map(
            (topic) =>
              `<span style="
                display: inline-block;
                background-color: #2a2a2a;
                color: #c0c0c0;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 13px;
                margin: 2px 4px 2px 0;
              ">${topic}</span>`
          )
          .join('')}
      </div>
    `
    : '';

  return {
    subject: `Your weekly TribeMem digest for ${orgName}`,
    html: layout(`
      <h1 style="${HEADING_STYLES}">Weekly Digest</h1>
      <p style="color: #e0e0e0; font-size: 15px; line-height: 1.6;">
        Here's what happened in <strong style="color: #ffffff;">${orgName}</strong> this week.
      </p>
      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin: 24px 0;
      ">
        <div style="background-color: #262626; padding: 16px; border-radius: 6px;">
          <p style="color: #888888; font-size: 12px; margin: 0 0 4px 0;">Knowledge Units Added</p>
          <p style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">${stats.knowledgeUnitsAdded}</p>
        </div>
        <div style="background-color: #262626; padding: 16px; border-radius: 6px;">
          <p style="color: #888888; font-size: 12px; margin: 0 0 4px 0;">Sources Processed</p>
          <p style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">${stats.sourcesProcessed}</p>
        </div>
        <div style="background-color: #262626; padding: 16px; border-radius: 6px;">
          <p style="color: #888888; font-size: 12px; margin: 0 0 4px 0;">Queries Answered</p>
          <p style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">${stats.queriesAnswered}</p>
        </div>
        <div style="background-color: #262626; padding: 16px; border-radius: 6px;">
          <p style="color: #888888; font-size: 12px; margin: 0 0 4px 0;">Active Members</p>
          <p style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">${stats.activeMembers}</p>
        </div>
      </div>
      ${topTopicsHtml}
      <div style="margin-top: 24px;">
        <a href="https://app.tribemem.com/dashboard" style="${BUTTON_STYLES}">View Dashboard</a>
      </div>
    `),
  };
}

export function apiKeyCreatedEmail(keyName: string): EmailTemplate {
  return {
    subject: '[TribeMem] New API key created',
    html: layout(`
      <h1 style="${HEADING_STYLES}">New API Key Created</h1>
      <p style="color: #e0e0e0; font-size: 15px; line-height: 1.6;">
        A new API key named <strong style="color: #ffffff;">${keyName}</strong> was just created on your account.
      </p>
      <div style="
        background-color: #262626;
        border-left: 4px solid #6366f1;
        padding: 16px;
        border-radius: 4px;
        margin: 16px 0;
      ">
        <p style="color: #e0e0e0; font-size: 14px; line-height: 1.6; margin: 0;">
          If you did not create this key, please review your account security settings immediately and revoke any unauthorized keys.
        </p>
      </div>
      <div style="margin-top: 24px;">
        <a href="https://app.tribemem.com/dashboard/settings/api-keys" style="${BUTTON_STYLES}">Manage API Keys</a>
      </div>
    `),
  };
}
