import { Octokit } from '@octokit/rest';
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

const GITHUB_APP_ID = process.env.GITHUB_APP_ID || '';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

const PER_PAGE = 100;

export class GitHubConnector extends BaseConnector {
  type: ConnectorType = 'github';

  getAuthUrl(orgId: string, redirectUrl: string): string {
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: redirectUrl,
      state: orgId,
      scope: 'repo read:org',
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(
    code: string,
    _orgId: string,
  ): Promise<ConnectorCredentials> {
    const response = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub OAuth failed: ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
    }

    return {
      access_token: data.access_token as string,
      scope: data.scope as string,
      extra: {
        token_type: data.token_type,
      },
    };
  }

  async refreshToken(_connector: Connector): Promise<ConnectorCredentials> {
    // GitHub OAuth tokens don't expire unless using GitHub App installations
    throw new Error(
      'GitHub OAuth tokens do not expire. Re-authorize if the token is revoked.',
    );
  }

  async fetchEvents(
    connector: Connector,
    cursor: SyncCursor | null,
  ): Promise<FetchEventsResult> {
    const credentials = this.parseCredentials(connector);
    const octokit = new Octokit({ auth: credentials.access_token });

    const since = cursor?.cursor_value || '1970-01-01T00:00:00Z';
    const repos =
      (connector.config.settings.repos as string[]) || [];

    const allEvents: RawEvent[] = [];
    let latestUpdate = since;
    let hasMore = false;

    // If no repos are configured, fetch repos the user has access to
    let repoList = repos;
    if (repoList.length === 0) {
      const reposResponse = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 20,
      });
      repoList = reposResponse.data.map((r) => r.full_name);
    }

    for (const repoFullName of repoList) {
      const [owner, repo] = repoFullName.split('/');
      if (!owner || !repo) continue;

      try {
        // Fetch PRs
        const prs = await octokit.pulls.list({
          owner,
          repo,
          state: 'all',
          sort: 'updated',
          direction: 'desc',
          per_page: PER_PAGE,
        });

        for (const pr of prs.data) {
          if (pr.updated_at <= since) continue;

          if (pr.updated_at > latestUpdate) {
            latestUpdate = pr.updated_at;
          }

          // Fetch PR comments
          let commentsText = '';
          try {
            const comments = await octokit.issues.listComments({
              owner,
              repo,
              issue_number: pr.number,
              per_page: 50,
            });

            commentsText = comments.data
              .map(
                (c) =>
                  `\n---\nComment by ${c.user?.login || 'unknown'}:\n${c.body || ''}`,
              )
              .join('');
          } catch {
            // Comments fetch is non-critical
          }

          const content = `[${repoFullName}] PR #${pr.number}: ${pr.title}\nState: ${pr.state} | Author: ${pr.user?.login || 'unknown'}\nBase: ${pr.base.ref} <- ${pr.head.ref}\n\n${pr.body || '(no description)'}${commentsText}`;

          allEvents.push({
            id: uuid(),
            org_id: connector.org_id,
            connector_id: connector.id,
            connector_type: 'github',
            external_id: `pr:${repoFullName}:${pr.number}`,
            event_type: 'pull_request',
            author_external_id: pr.user?.login || null,
            author_name: pr.user?.login || null,
            content,
            raw_payload: pr as unknown as Record<string, unknown>,
            occurred_at: pr.updated_at,
            ingested_at: new Date().toISOString(),
            processed: false,
            processed_at: null,
          });
        }

        // Fetch issues
        const issues = await octokit.issues.listForRepo({
          owner,
          repo,
          state: 'all',
          sort: 'updated',
          direction: 'desc',
          since,
          per_page: PER_PAGE,
        });

        for (const issue of issues.data) {
          // Skip PRs (GitHub returns PRs in issues endpoint too)
          if (issue.pull_request) continue;

          if (issue.updated_at > latestUpdate) {
            latestUpdate = issue.updated_at;
          }

          const content = `[${repoFullName}] Issue #${issue.number}: ${issue.title}\nState: ${issue.state} | Author: ${issue.user?.login || 'unknown'}\nLabels: ${issue.labels.map((l) => (typeof l === 'string' ? l : l.name)).join(', ') || 'none'}\n\n${issue.body || '(no description)'}`;

          allEvents.push({
            id: uuid(),
            org_id: connector.org_id,
            connector_id: connector.id,
            connector_type: 'github',
            external_id: `issue:${repoFullName}:${issue.number}`,
            event_type: 'issue',
            author_external_id: issue.user?.login || null,
            author_name: issue.user?.login || null,
            content,
            raw_payload: issue as unknown as Record<string, unknown>,
            occurred_at: issue.updated_at,
            ingested_at: new Date().toISOString(),
            processed: false,
            processed_at: null,
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(
          `[GitHub] Failed to fetch data for ${repoFullName}: ${message}`,
        );
      }
    }

    const nextCursor: SyncCursor = {
      id: cursor?.id || uuid(),
      connector_id: connector.id,
      cursor_type: 'github_updated_since',
      cursor_value: latestUpdate,
      metadata: {},
      updated_at: new Date().toISOString(),
    };

    return { events: allEvents, nextCursor, hasMore };
  }

  async testConnection(connector: Connector): Promise<boolean> {
    try {
      const credentials = this.parseCredentials(connector);
      const octokit = new Octokit({ auth: credentials.access_token });
      const result = await octokit.users.getAuthenticated();
      return !!result.data.login;
    } catch {
      return false;
    }
  }

  getSourceUrl(event: RawEvent): string | null {
    const parts = event.external_id.split(':');
    const type = parts[0]; // 'pr' or 'issue'
    const repoFullName = parts[1];
    const number = parts[2];

    if (repoFullName && number) {
      if (type === 'pr') {
        return `https://github.com/${repoFullName}/pull/${number}`;
      }
      return `https://github.com/${repoFullName}/issues/${number}`;
    }

    return null;
  }

  async handleWebhook(payload: unknown): Promise<RawEvent[]> {
    const body = payload as Record<string, unknown>;
    const action = body.action as string;

    // Handle PR events
    const pr = body.pull_request as Record<string, unknown> | undefined;
    if (pr) {
      const repo = body.repository as Record<string, unknown>;
      const repoFullName = repo?.full_name as string;
      const prNumber = pr.number as number;
      const user = pr.user as Record<string, unknown>;

      return [
        {
          id: uuid(),
          org_id: '',
          connector_id: '',
          connector_type: 'github',
          external_id: `pr:${repoFullName}:${prNumber}`,
          event_type: `pull_request.${action}`,
          author_external_id: (user?.login as string) || null,
          author_name: (user?.login as string) || null,
          content: `[${repoFullName}] PR #${prNumber}: ${pr.title}\n\n${pr.body || ''}`,
          raw_payload: body,
          occurred_at: (pr.updated_at as string) || new Date().toISOString(),
          ingested_at: new Date().toISOString(),
          processed: false,
          processed_at: null,
        },
      ];
    }

    // Handle issue events
    const issue = body.issue as Record<string, unknown> | undefined;
    if (issue) {
      const repo = body.repository as Record<string, unknown>;
      const repoFullName = repo?.full_name as string;
      const issueNumber = issue.number as number;
      const user = issue.user as Record<string, unknown>;

      return [
        {
          id: uuid(),
          org_id: '',
          connector_id: '',
          connector_type: 'github',
          external_id: `issue:${repoFullName}:${issueNumber}`,
          event_type: `issue.${action}`,
          author_external_id: (user?.login as string) || null,
          author_name: (user?.login as string) || null,
          content: `[${repoFullName}] Issue #${issueNumber}: ${issue.title}\n\n${issue.body || ''}`,
          raw_payload: body,
          occurred_at: (issue.updated_at as string) || new Date().toISOString(),
          ingested_at: new Date().toISOString(),
          processed: false,
          processed_at: null,
        },
      ];
    }

    return [];
  }
}
