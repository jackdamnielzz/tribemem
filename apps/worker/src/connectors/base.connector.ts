import type {
  ConnectorType,
  Connector,
  RawEvent,
  SyncCursor,
} from '@tribemem/shared';

export interface ConnectorCredentials {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  scope?: string;
  extra?: Record<string, unknown>;
}

export interface FetchEventsResult {
  events: RawEvent[];
  nextCursor: SyncCursor;
  hasMore: boolean;
}

/**
 * Abstract base class for all connectors.
 * Each connector implementation handles OAuth, data fetching, and webhook processing
 * for a specific third-party integration.
 */
export abstract class BaseConnector {
  /** The connector type identifier */
  abstract type: ConnectorType;

  /**
   * Generate the OAuth authorization URL for this connector.
   */
  abstract getAuthUrl(orgId: string, redirectUrl: string): string;

  /**
   * Handle the OAuth callback and exchange code for credentials.
   */
  abstract handleCallback(
    code: string,
    orgId: string,
  ): Promise<ConnectorCredentials>;

  /**
   * Refresh an expired access token.
   */
  abstract refreshToken(connector: Connector): Promise<ConnectorCredentials>;

  /**
   * Fetch events from the connector starting from the given cursor.
   * Returns a batch of events and the cursor position for the next fetch.
   */
  abstract fetchEvents(
    connector: Connector,
    cursor: SyncCursor | null,
  ): Promise<FetchEventsResult>;

  /**
   * Test that the connection is still valid and credentials work.
   */
  abstract testConnection(connector: Connector): Promise<boolean>;

  /**
   * Generate a URL pointing to the original source for a raw event.
   */
  abstract getSourceUrl(event: RawEvent): string | null;

  /**
   * Handle an incoming webhook payload. Optional: not all connectors use webhooks.
   */
  handleWebhook?(payload: unknown): Promise<RawEvent[]>;

  /**
   * Decrypt and parse stored connector credentials.
   */
  protected parseCredentials(connector: Connector): ConnectorCredentials {
    if (!connector.credentials_encrypted) {
      throw new Error(`Connector ${connector.id} has no stored credentials`);
    }
    // In production, this would decrypt the credentials.
    // For now, assume the stored value is JSON-encoded.
    return JSON.parse(connector.credentials_encrypted) as ConnectorCredentials;
  }

  /**
   * Check if stored credentials are expired and need refreshing.
   */
  protected isTokenExpired(credentials: ConnectorCredentials): boolean {
    if (!credentials.expires_at) return false;
    const expiresAt = new Date(credentials.expires_at).getTime();
    // Refresh 5 minutes before expiry
    return Date.now() > expiresAt - 5 * 60 * 1000;
  }
}
