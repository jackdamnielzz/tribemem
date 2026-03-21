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

const INTERCOM_CLIENT_ID = process.env.INTERCOM_CLIENT_ID || '';
const INTERCOM_CLIENT_SECRET = process.env.INTERCOM_CLIENT_SECRET || '';

export class IntercomConnector extends BaseConnector {
  type: ConnectorType = 'intercom';

  getAuthUrl(orgId: string, redirectUrl: string): string {
    const params = new URLSearchParams({
      client_id: INTERCOM_CLIENT_ID,
      redirect_uri: redirectUrl,
      state: orgId,
    });

    return `https://app.intercom.com/oauth?${params.toString()}`;
  }

  async handleCallback(
    code: string,
    _orgId: string,
  ): Promise<ConnectorCredentials> {
    const response = await fetch(
      'https://api.intercom.io/auth/eagle/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: INTERCOM_CLIENT_ID,
          client_secret: INTERCOM_CLIENT_SECRET,
          code,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Intercom OAuth failed: ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    return {
      access_token: data.token as string,
    };
  }

  async refreshToken(_connector: Connector): Promise<ConnectorCredentials> {
    // Intercom tokens don't expire
    throw new Error(
      'Intercom tokens do not expire. Re-authorize if access is revoked.',
    );
  }

  async fetchEvents(
    connector: Connector,
    cursor: SyncCursor | null,
  ): Promise<FetchEventsResult> {
    const credentials = this.parseCredentials(connector);
    const updatedAfter = cursor?.cursor_value
      ? Math.floor(new Date(cursor.cursor_value).getTime() / 1000)
      : 0;

    // Search conversations updated after cursor
    const response = await fetch(
      'https://api.intercom.io/conversations/search',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
          'Intercom-Version': '2.10',
        },
        body: JSON.stringify({
          query: {
            field: 'updated_at',
            operator: '>',
            value: updatedAfter,
          },
          pagination: {
            per_page: 50,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Intercom API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    const conversations =
      (data.conversations as Array<Record<string, unknown>>) || [];
    const pages = data.pages as Record<string, unknown> | undefined;
    const hasMore = pages?.next !== undefined && pages?.next !== null;

    const allEvents: RawEvent[] = [];
    let latestUpdate = cursor?.cursor_value || '1970-01-01T00:00:00Z';

    for (const conv of conversations) {
      const updatedAt = new Date(
        (conv.updated_at as number) * 1000,
      ).toISOString();

      if (updatedAt > latestUpdate) {
        latestUpdate = updatedAt;
      }

      const source = conv.source as Record<string, unknown> | undefined;
      const subject =
        (source?.subject as string) ||
        (conv.title as string) ||
        'Untitled conversation';
      const body = (source?.body as string) || '';

      // Extract conversation parts for content
      const parts = (conv.conversation_parts as Record<string, unknown>)
        ?.conversation_parts as Array<Record<string, unknown>> | undefined;
      let partsText = '';
      if (parts) {
        partsText = parts
          .map((p) => {
            const author = p.author as Record<string, unknown>;
            const authorName = (author?.name as string) || 'Unknown';
            return `\n---\n${authorName}: ${(p.body as string) || ''}`;
          })
          .join('');
      }

      const content = `Conversation: ${subject}\n\n${body}${partsText}`;

      allEvents.push({
        id: uuid(),
        org_id: connector.org_id,
        connector_id: connector.id,
        connector_type: 'intercom',
        external_id: conv.id as string,
        event_type: 'conversation',
        author_external_id: null,
        author_name: null,
        content,
        raw_payload: conv,
        occurred_at: updatedAt,
        ingested_at: new Date().toISOString(),
        processed: false,
        processed_at: null,
      });
    }

    const nextCursor: SyncCursor = {
      id: cursor?.id || uuid(),
      connector_id: connector.id,
      cursor_type: 'intercom_updated_at',
      cursor_value: latestUpdate,
      metadata: {},
      updated_at: new Date().toISOString(),
    };

    return { events: allEvents, nextCursor, hasMore };
  }

  async testConnection(connector: Connector): Promise<boolean> {
    try {
      const credentials = this.parseCredentials(connector);
      const response = await fetch('https://api.intercom.io/me', {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
          'Intercom-Version': '2.10',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getSourceUrl(event: RawEvent): string | null {
    return `https://app.intercom.com/a/apps/_/inbox/inbox/conversation/${event.external_id}`;
  }
}
