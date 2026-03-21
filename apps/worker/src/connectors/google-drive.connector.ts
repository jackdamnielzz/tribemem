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

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

export class GoogleDriveConnector extends BaseConnector {
  type: ConnectorType = 'google_drive';

  getAuthUrl(orgId: string, redirectUrl: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUrl,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent',
      state: orgId,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleCallback(
    code: string,
    _orgId: string,
  ): Promise<ConnectorCredentials> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`Google OAuth failed: ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    return {
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string,
      expires_at: new Date(
        Date.now() + (data.expires_in as number) * 1000,
      ).toISOString(),
      scope: data.scope as string,
    };
  }

  async refreshToken(connector: Connector): Promise<ConnectorCredentials> {
    const credentials = this.parseCredentials(connector);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: credentials.refresh_token || '',
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Google token refresh failed: ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    return {
      access_token: data.access_token as string,
      refresh_token: credentials.refresh_token, // Google doesn't always return a new refresh token
      expires_at: new Date(
        Date.now() + (data.expires_in as number) * 1000,
      ).toISOString(),
      scope: data.scope as string,
    };
  }

  async fetchEvents(
    connector: Connector,
    cursor: SyncCursor | null,
  ): Promise<FetchEventsResult> {
    const credentials = this.parseCredentials(connector);

    if (this.isTokenExpired(credentials)) {
      throw new Error('Google token expired. Refresh required before fetching.');
    }

    // Use the Changes API with a start page token
    const pageToken = cursor?.cursor_value || undefined;

    let changesUrl = 'https://www.googleapis.com/drive/v3/changes?pageSize=100&fields=*';

    // If no page token, get the start page token first
    if (!pageToken) {
      const startTokenResponse = await fetch(
        'https://www.googleapis.com/drive/v3/changes/startPageToken',
        {
          headers: { Authorization: `Bearer ${credentials.access_token}` },
        },
      );

      if (!startTokenResponse.ok) {
        throw new Error(`Google Drive API error: ${startTokenResponse.statusText}`);
      }

      const startTokenData = (await startTokenResponse.json()) as Record<string, unknown>;

      // For first sync, we list files instead
      return this.fetchInitialFiles(connector, credentials, startTokenData.startPageToken as string);
    }

    changesUrl += `&pageToken=${pageToken}`;

    const response = await fetch(changesUrl, {
      headers: { Authorization: `Bearer ${credentials.access_token}` },
    });

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    const changes = (data.changes as Array<Record<string, unknown>>) || [];
    const newPageToken = data.newStartPageToken as string | undefined;
    const nextPageToken = data.nextPageToken as string | undefined;

    const allEvents: RawEvent[] = [];

    for (const change of changes) {
      if (change.removed) continue;

      const file = change.file as Record<string, unknown> | undefined;
      if (!file) continue;

      // Only process Google Docs, Sheets, and text files
      const mimeType = file.mimeType as string;
      if (
        !mimeType?.startsWith('application/vnd.google-apps.') &&
        !mimeType?.startsWith('text/')
      ) {
        continue;
      }

      allEvents.push({
        id: uuid(),
        org_id: connector.org_id,
        connector_id: connector.id,
        connector_type: 'google_drive',
        external_id: file.id as string,
        event_type: 'file_change',
        author_external_id: null,
        author_name: (file.lastModifyingUser as Record<string, unknown>)?.displayName as string || null,
        content: `File: ${file.name}\nType: ${mimeType}\n\n(Content extraction pending)`,
        raw_payload: change,
        occurred_at: (file.modifiedTime as string) || new Date().toISOString(),
        ingested_at: new Date().toISOString(),
        processed: false,
        processed_at: null,
      });
    }

    const nextCursor: SyncCursor = {
      id: cursor?.id || uuid(),
      connector_id: connector.id,
      cursor_type: 'google_drive_page_token',
      cursor_value: nextPageToken || newPageToken || '',
      metadata: {},
      updated_at: new Date().toISOString(),
    };

    return {
      events: allEvents,
      nextCursor,
      hasMore: !!nextPageToken,
    };
  }

  private async fetchInitialFiles(
    connector: Connector,
    credentials: ConnectorCredentials,
    startPageToken: string,
  ): Promise<FetchEventsResult> {
    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?pageSize=100&fields=files(id,name,mimeType,modifiedTime,lastModifyingUser)&orderBy=modifiedTime desc',
      {
        headers: { Authorization: `Bearer ${credentials.access_token}` },
      },
    );

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    const files = (data.files as Array<Record<string, unknown>>) || [];

    const allEvents: RawEvent[] = files
      .filter((f) => {
        const mimeType = f.mimeType as string;
        return (
          mimeType?.startsWith('application/vnd.google-apps.') ||
          mimeType?.startsWith('text/')
        );
      })
      .map((file) => ({
        id: uuid(),
        org_id: connector.org_id,
        connector_id: connector.id,
        connector_type: 'google_drive' as const,
        external_id: file.id as string,
        event_type: 'file_initial',
        author_external_id: null,
        author_name:
          (file.lastModifyingUser as Record<string, unknown>)?.displayName as string || null,
        content: `File: ${file.name}\nType: ${file.mimeType}\n\n(Content extraction pending)`,
        raw_payload: file,
        occurred_at: (file.modifiedTime as string) || new Date().toISOString(),
        ingested_at: new Date().toISOString(),
        processed: false,
        processed_at: null,
      }));

    const nextCursor: SyncCursor = {
      id: uuid(),
      connector_id: connector.id,
      cursor_type: 'google_drive_page_token',
      cursor_value: startPageToken,
      metadata: {},
      updated_at: new Date().toISOString(),
    };

    return { events: allEvents, nextCursor, hasMore: false };
  }

  async testConnection(connector: Connector): Promise<boolean> {
    try {
      const credentials = this.parseCredentials(connector);
      const response = await fetch(
        'https://www.googleapis.com/drive/v3/about?fields=user',
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
    const fileId = event.external_id;
    return `https://drive.google.com/file/d/${fileId}`;
  }
}
