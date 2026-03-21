import { v4 as uuid } from 'uuid';
import type {
  ConnectorType,
  Connector,
  RawEvent,
  SyncCursor,
} from '@tribemem/shared';
import {
  BaseConnector,
  type ConnectorCredentials,
  type FetchEventsResult,
} from './base.connector';

const JIRA_CLIENT_ID = process.env.JIRA_CLIENT_ID || '';
const JIRA_CLIENT_SECRET = process.env.JIRA_CLIENT_SECRET || '';

const MAX_RESULTS = 50;

export class JiraConnector extends BaseConnector {
  type: ConnectorType = 'jira';

  getAuthUrl(orgId: string, redirectUrl: string): string {
    const scopes = [
      'read:jira-work',
      'read:jira-user',
      'offline_access',
    ].join(' ');

    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: JIRA_CLIENT_ID,
      scope: scopes,
      redirect_uri: redirectUrl,
      state: orgId,
      response_type: 'code',
      prompt: 'consent',
    });

    return `https://auth.atlassian.com/authorize?${params.toString()}`;
  }

  async handleCallback(
    code: string,
    _orgId: string,
  ): Promise<ConnectorCredentials> {
    const response = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: JIRA_CLIENT_ID,
        client_secret: JIRA_CLIENT_SECRET,
        code,
        redirect_uri: process.env.JIRA_REDIRECT_URI || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`Jira OAuth failed: ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    // Get accessible resources (cloud instances)
    const resourcesResponse = await fetch(
      'https://api.atlassian.com/oauth/token/accessible-resources',
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
      },
    );

    const resources = (await resourcesResponse.json()) as Array<Record<string, unknown>>;
    const site = resources[0]; // Use first accessible site

    return {
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string,
      expires_at: new Date(
        Date.now() + (data.expires_in as number) * 1000,
      ).toISOString(),
      scope: data.scope as string,
      extra: {
        cloud_id: site?.id,
        site_url: site?.url,
        site_name: site?.name,
      },
    };
  }

  async refreshToken(connector: Connector): Promise<ConnectorCredentials> {
    const credentials = this.parseCredentials(connector);

    const response = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: JIRA_CLIENT_ID,
        client_secret: JIRA_CLIENT_SECRET,
        refresh_token: credentials.refresh_token,
      }),
    });

    if (!response.ok) {
      throw new Error(`Jira token refresh failed: ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    return {
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string,
      expires_at: new Date(
        Date.now() + (data.expires_in as number) * 1000,
      ).toISOString(),
      scope: data.scope as string,
      extra: credentials.extra,
    };
  }

  async fetchEvents(
    connector: Connector,
    cursor: SyncCursor | null,
  ): Promise<FetchEventsResult> {
    const credentials = this.parseCredentials(connector);

    if (this.isTokenExpired(credentials)) {
      throw new Error('Jira token expired. Refresh required before fetching.');
    }

    const cloudId = credentials.extra?.cloud_id as string;
    if (!cloudId) {
      throw new Error('Jira cloud_id not found in credentials');
    }

    const updatedAfter =
      cursor?.cursor_value || '1970-01-01 00:00';
    const startAt = (cursor?.metadata?.startAt as number) || 0;

    const jql = `updatedDate >= "${updatedAfter}" ORDER BY updatedDate ASC`;
    const baseUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3`;

    const searchUrl = `${baseUrl}/search?jql=${encodeURIComponent(jql)}&maxResults=${MAX_RESULTS}&startAt=${startAt}&fields=summary,description,status,assignee,reporter,comment,updated,project,issuetype`;

    const response = await this.fetchWithRateLimit(searchUrl, credentials.access_token);
    const data = (await response.json()) as Record<string, unknown>;

    const issues = (data.issues as Array<Record<string, unknown>>) || [];
    const total = data.total as number;
    const allEvents: RawEvent[] = [];
    let latestUpdated = updatedAfter;

    for (const issue of issues) {
      const fields = issue.fields as Record<string, unknown>;
      const key = issue.key as string;
      const updated = fields.updated as string;

      if (updated > latestUpdated) {
        latestUpdated = updated;
      }

      // Build issue content
      const summary = fields.summary as string;
      const description =
        this.extractAdfText(fields.description) || '(no description)';
      const status = (fields.status as Record<string, unknown>)?.name || 'Unknown';
      const assignee = (fields.assignee as Record<string, unknown>)?.displayName || 'Unassigned';
      const reporter = ((fields.reporter as Record<string, unknown>)?.displayName as string) || 'Unknown';
      const project = (fields.project as Record<string, unknown>)?.name || '';
      const issueType = (fields.issuetype as Record<string, unknown>)?.name || '';

      let content = `[${project}] ${key}: ${summary}\nType: ${issueType} | Status: ${status}\nAssignee: ${assignee} | Reporter: ${reporter}\n\n${description}`;

      // Include comments
      const comments = fields.comment as Record<string, unknown> | undefined;
      if (comments) {
        const commentList = (comments.comments as Array<Record<string, unknown>>) || [];
        for (const comment of commentList) {
          const author = (comment.author as Record<string, unknown>)?.displayName || 'Unknown';
          const body = this.extractAdfText(comment.body) || '';
          content += `\n\n---\nComment by ${author}:\n${body}`;
        }
      }

      const event: RawEvent = {
        id: uuid(),
        org_id: connector.org_id,
        connector_id: connector.id,
        connector_type: 'jira',
        external_id: issue.id as string,
        event_type: 'issue_update',
        author_external_id:
          ((fields.reporter as Record<string, unknown>)?.accountId as string) || null,
        author_name: reporter,
        content,
        raw_payload: issue,
        occurred_at: updated,
        ingested_at: new Date().toISOString(),
        processed: false,
        processed_at: null,
      };

      allEvents.push(event);
    }

    const hasMore = startAt + issues.length < total;

    const nextCursor: SyncCursor = {
      id: cursor?.id || uuid(),
      connector_id: connector.id,
      cursor_type: 'jira_updated_date',
      cursor_value: hasMore ? updatedAfter : latestUpdated,
      metadata: hasMore ? { startAt: startAt + issues.length } : {},
      updated_at: new Date().toISOString(),
    };

    return { events: allEvents, nextCursor, hasMore };
  }

  async testConnection(connector: Connector): Promise<boolean> {
    try {
      const credentials = this.parseCredentials(connector);
      const cloudId = credentials.extra?.cloud_id as string;
      if (!cloudId) return false;

      const response = await fetch(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/myself`,
        {
          headers: { Authorization: `Bearer ${credentials.access_token}` },
        },
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  getSourceUrl(event: RawEvent): string | null {
    const payload = event.raw_payload;
    const siteUrl = (payload as Record<string, unknown>).self as string | undefined;
    const key = (payload as Record<string, unknown>).key as string | undefined;

    if (siteUrl && key) {
      const baseUrl = siteUrl.split('/rest/')[0];
      return `${baseUrl}/browse/${key}`;
    }

    return null;
  }

  /**
   * Fetch with Jira rate limit header handling.
   */
  private async fetchWithRateLimit(
    url: string,
    token: string,
  ): Promise<Response> {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (response.status === 429) {
      const retryAfter = parseInt(
        response.headers.get('Retry-After') || '10',
        10,
      );
      console.warn(`[Jira] Rate limited, retrying after ${retryAfter}s`);
      await new Promise((resolve) =>
        setTimeout(resolve, retryAfter * 1000),
      );
      return this.fetchWithRateLimit(url, token);
    }

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  /**
   * Extract plain text from Atlassian Document Format (ADF).
   */
  private extractAdfText(adf: unknown): string {
    if (!adf || typeof adf !== 'object') return '';

    const node = adf as Record<string, unknown>;

    if (node.type === 'text') {
      return (node.text as string) || '';
    }

    const content = node.content as Array<Record<string, unknown>> | undefined;
    if (!content || !Array.isArray(content)) return '';

    return content
      .map((child) => this.extractAdfText(child))
      .filter(Boolean)
      .join(node.type === 'paragraph' ? '\n' : ' ');
  }
}
