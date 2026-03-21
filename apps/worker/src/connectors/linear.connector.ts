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

const LINEAR_CLIENT_ID = process.env.LINEAR_CLIENT_ID || '';
const LINEAR_CLIENT_SECRET = process.env.LINEAR_CLIENT_SECRET || '';

export class LinearConnector extends BaseConnector {
  type: ConnectorType = 'linear';

  getAuthUrl(orgId: string, redirectUrl: string): string {
    const params = new URLSearchParams({
      client_id: LINEAR_CLIENT_ID,
      redirect_uri: redirectUrl,
      response_type: 'code',
      scope: 'read',
      state: orgId,
      prompt: 'consent',
    });

    return `https://linear.app/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(
    code: string,
    _orgId: string,
  ): Promise<ConnectorCredentials> {
    const response = await fetch('https://api.linear.app/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: LINEAR_CLIENT_ID,
        client_secret: LINEAR_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.LINEAR_REDIRECT_URI || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`Linear OAuth failed: ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    return {
      access_token: data.access_token as string,
      scope: (data.scope as string[])?.join(' '),
      expires_at: data.expires_in
        ? new Date(
            Date.now() + (data.expires_in as number) * 1000,
          ).toISOString()
        : undefined,
    };
  }

  async refreshToken(_connector: Connector): Promise<ConnectorCredentials> {
    // Linear tokens currently don't have a standard refresh flow
    throw new Error(
      'Linear token refresh not supported. Re-authorize if access is revoked.',
    );
  }

  async fetchEvents(
    connector: Connector,
    cursor: SyncCursor | null,
  ): Promise<FetchEventsResult> {
    const credentials = this.parseCredentials(connector);
    const updatedAfter = cursor?.cursor_value || '1970-01-01T00:00:00Z';
    const afterCursor = (cursor?.metadata?.graphqlCursor as string) || undefined;

    // GraphQL query for recently updated issues
    const query = `
      query RecentIssues($after: String, $updatedAfter: DateTime!) {
        issues(
          first: 50
          after: $after
          filter: { updatedAt: { gte: $updatedAfter } }
          orderBy: updatedAt
        ) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            identifier
            title
            description
            state { name }
            assignee { name email }
            creator { name email }
            team { name key }
            project { name }
            labels { nodes { name } }
            priority
            priorityLabel
            updatedAt
            createdAt
            url
            comments {
              nodes {
                body
                user { name }
                createdAt
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        Authorization: credentials.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          after: afterCursor,
          updatedAfter: updatedAfter,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Linear API error: ${response.status} ${response.statusText}`);
    }

    const result = (await response.json()) as Record<string, unknown>;
    const data = result.data as Record<string, unknown>;
    const issues = data?.issues as Record<string, unknown>;
    const nodes = (issues?.nodes as Array<Record<string, unknown>>) || [];
    const pageInfo = issues?.pageInfo as Record<string, unknown>;
    const hasMore = (pageInfo?.hasNextPage as boolean) || false;

    const allEvents: RawEvent[] = [];
    let latestUpdate = updatedAfter;

    for (const issue of nodes) {
      const updatedAt = issue.updatedAt as string;
      if (updatedAt > latestUpdate) {
        latestUpdate = updatedAt;
      }

      const team = issue.team as Record<string, unknown> | undefined;
      const assignee = issue.assignee as Record<string, unknown> | undefined;
      const creator = issue.creator as Record<string, unknown> | undefined;
      const state = issue.state as Record<string, unknown> | undefined;
      const labels = issue.labels as Record<string, unknown> | undefined;
      const labelNodes = (labels?.nodes as Array<Record<string, unknown>>) || [];

      let content = `[${team?.name || ''}] ${issue.identifier}: ${issue.title}`;
      content += `\nStatus: ${state?.name || 'Unknown'} | Priority: ${issue.priorityLabel || 'None'}`;
      content += `\nAssignee: ${assignee?.name || 'Unassigned'} | Creator: ${creator?.name || 'Unknown'}`;
      if (labelNodes.length > 0) {
        content += `\nLabels: ${labelNodes.map((l) => l.name).join(', ')}`;
      }
      content += `\n\n${(issue.description as string) || '(no description)'}`;

      // Add comments
      const comments = issue.comments as Record<string, unknown> | undefined;
      const commentNodes =
        (comments?.nodes as Array<Record<string, unknown>>) || [];
      for (const comment of commentNodes) {
        const user = comment.user as Record<string, unknown>;
        content += `\n---\nComment by ${user?.name || 'Unknown'}:\n${comment.body || ''}`;
      }

      allEvents.push({
        id: uuid(),
        org_id: connector.org_id,
        connector_id: connector.id,
        connector_type: 'linear',
        external_id: issue.id as string,
        event_type: 'issue_update',
        author_external_id: null,
        author_name: (creator?.name as string) || null,
        content,
        raw_payload: issue,
        occurred_at: updatedAt,
        ingested_at: new Date().toISOString(),
        processed: false,
        processed_at: null,
      });
    }

    const nextCursor: SyncCursor = {
      id: cursor?.id || uuid(),
      connector_id: connector.id,
      cursor_type: 'linear_updated_at',
      cursor_value: latestUpdate,
      metadata: hasMore
        ? { graphqlCursor: pageInfo?.endCursor }
        : {},
      updated_at: new Date().toISOString(),
    };

    return { events: allEvents, nextCursor, hasMore };
  }

  async testConnection(connector: Connector): Promise<boolean> {
    try {
      const credentials = this.parseCredentials(connector);
      const response = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: {
          Authorization: credentials.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: '{ viewer { id } }' }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getSourceUrl(event: RawEvent): string | null {
    const url = (event.raw_payload as Record<string, unknown>).url as string | undefined;
    return url || null;
  }
}
