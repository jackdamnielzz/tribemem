import { WebClient } from '@slack/web-api';
import pLimit from 'p-limit';
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

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || '';
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || '';

const RATE_LIMIT = pLimit(5); // Max 5 concurrent API calls
const MESSAGES_PER_PAGE = 200;
const MAX_CHANNELS_PER_FETCH = 20;

export class SlackConnector extends BaseConnector {
  type: ConnectorType = 'slack';

  getAuthUrl(orgId: string, redirectUrl: string): string {
    const scopes = [
      'channels:history',
      'channels:read',
      'groups:history',
      'groups:read',
      'users:read',
      'team:read',
    ].join(',');

    const params = new URLSearchParams({
      client_id: SLACK_CLIENT_ID,
      scope: scopes,
      redirect_uri: redirectUrl,
      state: orgId,
    });

    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  async handleCallback(
    code: string,
    _orgId: string,
  ): Promise<ConnectorCredentials> {
    const client = new WebClient();
    const result = await client.oauth.v2.access({
      client_id: SLACK_CLIENT_ID,
      client_secret: SLACK_CLIENT_SECRET,
      code,
    });

    return {
      access_token: result.access_token!,
      scope: result.scope,
      extra: {
        team_id: result.team?.id,
        team_name: result.team?.name,
        bot_user_id: result.bot_user_id,
      },
    };
  }

  async refreshToken(_connector: Connector): Promise<ConnectorCredentials> {
    // Slack bot tokens don't expire; they remain valid until revoked.
    // If we need to refresh, we should re-authenticate.
    throw new Error(
      'Slack bot tokens do not expire. Re-authorize if the token is revoked.',
    );
  }

  async fetchEvents(
    connector: Connector,
    cursor: SyncCursor | null,
  ): Promise<FetchEventsResult> {
    const credentials = this.parseCredentials(connector);
    const client = new WebClient(credentials.access_token);

    // Parse cursor: stores oldest timestamp per channel
    const cursorData: Record<string, string> =
      cursor?.metadata?.channel_cursors
        ? (cursor.metadata.channel_cursors as Record<string, string>)
        : {};

    // Get list of channels the bot has access to
    const channelsResult = await client.conversations.list({
      types: 'public_channel,private_channel',
      limit: MAX_CHANNELS_PER_FETCH,
      exclude_archived: true,
    });

    const channels = channelsResult.channels ?? [];
    const allEvents: RawEvent[] = [];
    const newCursors: Record<string, string> = { ...cursorData };
    let hasMore = false;

    // Fetch messages from each channel with concurrency limit
    await Promise.all(
      channels.map((channel) =>
        RATE_LIMIT(async () => {
          if (!channel.id || !channel.name) return;

          const oldest = cursorData[channel.id] || '0';

          try {
            const messagesResult = await client.conversations.history({
              channel: channel.id,
              oldest,
              limit: MESSAGES_PER_PAGE,
              inclusive: false,
            });

            const messages = messagesResult.messages ?? [];

            if (messagesResult.has_more) {
              hasMore = true;
            }

            for (const msg of messages) {
              if (!msg.ts || msg.subtype === 'channel_join' || msg.subtype === 'channel_leave') {
                continue;
              }

              // Resolve user name
              let authorName = msg.user || 'unknown';
              try {
                if (msg.user) {
                  const userInfo = await RATE_LIMIT(() =>
                    client.users.info({ user: msg.user! }),
                  );
                  authorName =
                    userInfo.user?.real_name ||
                    userInfo.user?.name ||
                    msg.user;
                }
              } catch {
                // Use user ID if lookup fails
              }

              const content = `[#${channel.name}] @${authorName}: ${msg.text || ''}`;

              const event: RawEvent = {
                id: uuid(),
                org_id: connector.org_id,
                connector_id: connector.id,
                connector_type: 'slack',
                external_id: `${channel.id}:${msg.ts}`,
                event_type: msg.thread_ts ? 'thread_reply' : 'message',
                author_external_id: msg.user || null,
                author_name: authorName,
                content,
                raw_payload: msg as unknown as Record<string, unknown>,
                occurred_at: new Date(parseFloat(msg.ts) * 1000).toISOString(),
                ingested_at: new Date().toISOString(),
                processed: false,
                processed_at: null,
              };

              allEvents.push(event);
            }

            // Update cursor to the latest message timestamp
            if (messages.length > 0) {
              const latestTs = messages[0]!.ts!;
              if (
                !newCursors[channel.id] ||
                parseFloat(latestTs) > parseFloat(newCursors[channel.id]!)
              ) {
                newCursors[channel.id] = latestTs;
              }
            }
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn(
              `[Slack] Failed to fetch messages for #${channel.name}: ${message}`,
            );
          }
        }),
      ),
    );

    const nextCursor: SyncCursor = {
      id: cursor?.id || uuid(),
      connector_id: connector.id,
      cursor_type: 'slack_channel_timestamps',
      cursor_value: JSON.stringify(newCursors),
      metadata: { channel_cursors: newCursors },
      updated_at: new Date().toISOString(),
    };

    return { events: allEvents, nextCursor, hasMore };
  }

  async testConnection(connector: Connector): Promise<boolean> {
    try {
      const credentials = this.parseCredentials(connector);
      const client = new WebClient(credentials.access_token);
      const result = await client.auth.test();
      return !!result.ok;
    } catch {
      return false;
    }
  }

  getSourceUrl(event: RawEvent): string | null {
    const payload = event.raw_payload as Record<string, unknown>;
    const teamId =
      (payload.team as string) ||
      (event.raw_payload as Record<string, unknown>).team_id;
    const externalParts = event.external_id.split(':');
    const channelId = externalParts[0];
    const ts = externalParts[1]?.replace('.', '');

    if (teamId && channelId && ts) {
      return `https://app.slack.com/client/${teamId}/${channelId}/p${ts}`;
    }

    return null;
  }

  async handleWebhook(payload: unknown): Promise<RawEvent[]> {
    const body = payload as Record<string, unknown>;

    // Handle URL verification challenge
    if (body.type === 'url_verification') {
      return [];
    }

    if (body.type !== 'event_callback') {
      return [];
    }

    const event = body.event as Record<string, unknown>;
    if (!event || event.type !== 'message') {
      return [];
    }

    // Skip bot messages and subtypes like joins/leaves
    if (event.bot_id || event.subtype) {
      return [];
    }

    const rawEvent: RawEvent = {
      id: uuid(),
      org_id: '', // Must be resolved by the caller
      connector_id: '', // Must be resolved by the caller
      connector_type: 'slack',
      external_id: `${event.channel}:${event.ts}`,
      event_type: event.thread_ts ? 'thread_reply' : 'message',
      author_external_id: (event.user as string) || null,
      author_name: null,
      content: (event.text as string) || '',
      raw_payload: body,
      occurred_at: new Date(
        parseFloat(event.ts as string) * 1000,
      ).toISOString(),
      ingested_at: new Date().toISOString(),
      processed: false,
      processed_at: null,
    };

    return [rawEvent];
  }
}
