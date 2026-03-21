import { Client as NotionClient } from '@notionhq/client';
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

const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID || '';
const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET || '';
const NOTION_REDIRECT_URI = process.env.NOTION_REDIRECT_URI || '';

const RATE_LIMIT_DELAY_MS = 334; // ~3 requests per second
const MAX_PAGES_PER_FETCH = 50;

async function rateLimit(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
}

export class NotionConnector extends BaseConnector {
  type: ConnectorType = 'notion';

  getAuthUrl(orgId: string, redirectUrl: string): string {
    const params = new URLSearchParams({
      client_id: NOTION_CLIENT_ID,
      redirect_uri: redirectUrl || NOTION_REDIRECT_URI,
      response_type: 'code',
      owner: 'user',
      state: orgId,
    });

    return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(
    code: string,
    _orgId: string,
  ): Promise<ConnectorCredentials> {
    const encoded = Buffer.from(
      `${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`,
    ).toString('base64');

    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encoded}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: NOTION_REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      throw new Error(`Notion OAuth failed: ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    return {
      access_token: data.access_token as string,
      extra: {
        workspace_id: data.workspace_id,
        workspace_name: data.workspace_name,
        bot_id: data.bot_id,
      },
    };
  }

  async refreshToken(_connector: Connector): Promise<ConnectorCredentials> {
    // Notion OAuth tokens don't expire
    throw new Error(
      'Notion tokens do not expire. Re-authorize if access is revoked.',
    );
  }

  async fetchEvents(
    connector: Connector,
    cursor: SyncCursor | null,
  ): Promise<FetchEventsResult> {
    const credentials = this.parseCredentials(connector);
    const notion = new NotionClient({ auth: credentials.access_token });

    const lastEditedAfter = cursor?.cursor_value || '1970-01-01T00:00:00.000Z';

    // Search for recently edited pages
    await rateLimit();
    const searchResult = await notion.search({
      filter: { property: 'object', value: 'page' },
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
      page_size: MAX_PAGES_PER_FETCH,
    });

    const allEvents: RawEvent[] = [];
    let latestEditTime = lastEditedAfter;
    let hasMore = searchResult.has_more;

    for (const page of searchResult.results) {
      if (page.object !== 'page') continue;

      const pageObj = page as Record<string, unknown>;
      const lastEdited = pageObj.last_edited_time as string;

      if (lastEdited <= lastEditedAfter) {
        hasMore = false;
        continue;
      }

      if (lastEdited > latestEditTime) {
        latestEditTime = lastEdited;
      }

      // Fetch page content blocks
      await rateLimit();
      let content = '';
      try {
        const blocks = await notion.blocks.children.list({
          block_id: page.id,
          page_size: 100,
        });

        content = this.blocksToMarkdown(blocks.results);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[Notion] Failed to read blocks for ${page.id}: ${message}`);
      }

      // Extract page title
      const title = this.extractPageTitle(pageObj);

      const event: RawEvent = {
        id: uuid(),
        org_id: connector.org_id,
        connector_id: connector.id,
        connector_type: 'notion',
        external_id: page.id,
        event_type: 'page_update',
        author_external_id: (pageObj.last_edited_by as Record<string, unknown>)?.id as string || null,
        author_name: null,
        content: `# ${title}\n\n${content}`,
        raw_payload: pageObj,
        occurred_at: lastEdited,
        ingested_at: new Date().toISOString(),
        processed: false,
        processed_at: null,
      };

      allEvents.push(event);
    }

    const nextCursor: SyncCursor = {
      id: cursor?.id || uuid(),
      connector_id: connector.id,
      cursor_type: 'notion_last_edited',
      cursor_value: latestEditTime,
      metadata: {},
      updated_at: new Date().toISOString(),
    };

    return { events: allEvents, nextCursor, hasMore };
  }

  async testConnection(connector: Connector): Promise<boolean> {
    try {
      const credentials = this.parseCredentials(connector);
      const notion = new NotionClient({ auth: credentials.access_token });
      await notion.users.me({});
      return true;
    } catch {
      return false;
    }
  }

  getSourceUrl(event: RawEvent): string | null {
    const pageId = event.external_id.replace(/-/g, '');
    return `https://notion.so/${pageId}`;
  }

  /**
   * Convert Notion block objects to a simple markdown string.
   */
  private blocksToMarkdown(blocks: unknown[]): string {
    const lines: string[] = [];

    for (const block of blocks) {
      const b = block as Record<string, unknown>;
      const type = b.type as string;
      const data = b[type] as Record<string, unknown> | undefined;

      if (!data) continue;

      const richText = data.rich_text as Array<{ plain_text: string }> | undefined;
      const text = richText?.map((t) => t.plain_text).join('') || '';

      switch (type) {
        case 'paragraph':
          lines.push(text);
          break;
        case 'heading_1':
          lines.push(`# ${text}`);
          break;
        case 'heading_2':
          lines.push(`## ${text}`);
          break;
        case 'heading_3':
          lines.push(`### ${text}`);
          break;
        case 'bulleted_list_item':
          lines.push(`- ${text}`);
          break;
        case 'numbered_list_item':
          lines.push(`1. ${text}`);
          break;
        case 'to_do': {
          const checked = data.checked ? 'x' : ' ';
          lines.push(`- [${checked}] ${text}`);
          break;
        }
        case 'toggle':
          lines.push(`> ${text}`);
          break;
        case 'code':
          lines.push(`\`\`\`${(data.language as string) || ''}\n${text}\n\`\`\``);
          break;
        case 'quote':
          lines.push(`> ${text}`);
          break;
        case 'divider':
          lines.push('---');
          break;
        case 'callout':
          lines.push(`> ${text}`);
          break;
        default:
          if (text) lines.push(text);
          break;
      }
    }

    return lines.join('\n\n');
  }

  /**
   * Extract the title from a Notion page object.
   */
  private extractPageTitle(page: Record<string, unknown>): string {
    const properties = page.properties as Record<string, unknown> | undefined;
    if (!properties) return 'Untitled';

    for (const prop of Object.values(properties)) {
      const p = prop as Record<string, unknown>;
      if (p.type === 'title') {
        const titleParts = p.title as Array<{ plain_text: string }> | undefined;
        if (titleParts && titleParts.length > 0) {
          return titleParts.map((t) => t.plain_text).join('');
        }
      }
    }

    return 'Untitled';
  }
}
