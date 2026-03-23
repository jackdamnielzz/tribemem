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

const DISCORD_API = 'https://discord.com/api/v10';
const MESSAGES_PER_PAGE = 100;

export class DiscordConnector extends BaseConnector {
  type: ConnectorType = 'discord';

  getAuthUrl(orgId: string, redirectUrl: string): string {
    const scopes = ['identify', 'guilds', 'guilds.members.read', 'messages.read'].join(' ');
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID || '',
      redirect_uri: redirectUrl,
      response_type: 'code',
      scope: scopes,
      state: orgId,
    });
    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  async handleCallback(
    code: string,
    _orgId: string,
  ): Promise<ConnectorCredentials> {
    const res = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID || '',
        client_secret: process.env.DISCORD_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        code,
      }).toString(),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Discord token exchange failed: ${error}`);
    }

    const data = (await res.json()) as Record<string, unknown>;

    return {
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string | undefined,
      expires_at: data.expires_in
        ? new Date(Date.now() + (data.expires_in as number) * 1000).toISOString()
        : undefined,
      scope: data.scope as string | undefined,
      extra: {
        guild_id: (data.guild as Record<string, unknown> | undefined)?.id,
      },
    };
  }

  async refreshToken(connector: Connector): Promise<ConnectorCredentials> {
    const credentials = this.parseCredentials(connector);
    if (!credentials.refresh_token) {
      throw new Error('No refresh token available for Discord connector');
    }

    const res = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID || '',
        client_secret: process.env.DISCORD_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
        refresh_token: credentials.refresh_token,
      }).toString(),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Discord token refresh failed: ${error}`);
    }

    const data = (await res.json()) as Record<string, unknown>;

    return {
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string | undefined,
      expires_at: data.expires_in
        ? new Date(Date.now() + (data.expires_in as number) * 1000).toISOString()
        : undefined,
      scope: data.scope as string | undefined,
    };
  }

  private async discordFetch(path: string, token: string): Promise<unknown> {
    const res = await fetch(`${DISCORD_API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Discord API ${path} failed (${res.status}): ${error}`);
    }
    return res.json();
  }

  async fetchEvents(
    connector: Connector,
    cursor: SyncCursor | null,
  ): Promise<FetchEventsResult> {
    const credentials = this.parseCredentials(connector);
    if (this.isTokenExpired(credentials)) {
      throw new Error('Discord token expired — refresh required');
    }

    const token = credentials.access_token;

    // Get guilds the user is in
    const guilds = (await this.discordFetch('/users/@me/guilds', token)) as {
      id: string;
      name: string;
    }[];

    const cursorData: Record<string, string> =
      cursor?.metadata?.channel_cursors
        ? (cursor.metadata.channel_cursors as Record<string, string>)
        : {};

    const allEvents: RawEvent[] = [];
    const newCursors: Record<string, string> = { ...cursorData };
    let hasMore = false;

    for (const guild of guilds) {
      // Get text channels in the guild
      let channels: { id: string; name: string; type: number }[];
      try {
        channels = (await this.discordFetch(
          `/guilds/${guild.id}/channels`,
          token,
        )) as { id: string; name: string; type: number }[];
      } catch {
        console.warn(`[Discord] Cannot access channels for guild ${guild.name}`);
        continue;
      }

      // Filter to text channels (type 0) and announcement channels (type 5)
      const textChannels = channels.filter((c) => c.type === 0 || c.type === 5);

      for (const channel of textChannels) {
        try {
          const afterParam = cursorData[channel.id] ? `&after=${cursorData[channel.id]}` : '';
          const messages = (await this.discordFetch(
            `/channels/${channel.id}/messages?limit=${MESSAGES_PER_PAGE}${afterParam}`,
            token,
          )) as {
            id: string;
            content: string;
            author: { id: string; username: string };
            timestamp: string;
            thread?: { id: string };
          }[];

          if (messages.length >= MESSAGES_PER_PAGE) {
            hasMore = true;
          }

          for (const msg of messages) {
            if (!msg.content && !msg.author) continue;

            const content = `[#${channel.name}] @${msg.author.username}: ${msg.content || ''}`;

            const event: RawEvent = {
              id: uuid(),
              org_id: connector.org_id,
              connector_id: connector.id,
              connector_type: 'discord',
              external_id: `${channel.id}:${msg.id}`,
              event_type: msg.thread ? 'thread_reply' : 'message',
              author_external_id: msg.author.id,
              author_name: msg.author.username,
              content,
              raw_payload: msg as unknown as Record<string, unknown>,
              occurred_at: new Date(msg.timestamp).toISOString(),
              ingested_at: new Date().toISOString(),
              processed: false,
              processed_at: null,
            };

            allEvents.push(event);
          }

          // Update cursor to latest message ID
          if (messages.length > 0) {
            const latestId = messages[0]!.id;
            newCursors[channel.id] = latestId;
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn(`[Discord] Failed to fetch messages for #${channel.name}: ${message}`);
        }
      }
    }

    const nextCursor: SyncCursor = {
      id: cursor?.id || uuid(),
      connector_id: connector.id,
      cursor_type: 'discord_message_ids',
      cursor_value: JSON.stringify(newCursors),
      metadata: { channel_cursors: newCursors },
      updated_at: new Date().toISOString(),
    };

    return { events: allEvents, nextCursor, hasMore };
  }

  async testConnection(connector: Connector): Promise<boolean> {
    try {
      const credentials = this.parseCredentials(connector);
      await this.discordFetch('/users/@me', credentials.access_token);
      return true;
    } catch {
      return false;
    }
  }

  getSourceUrl(event: RawEvent): string | null {
    const parts = event.external_id.split(':');
    const channelId = parts[0];
    const messageId = parts[1];
    if (channelId && messageId) {
      return `https://discord.com/channels/@me/${channelId}/${messageId}`;
    }
    return null;
  }
}
