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

const STRIPE_CLIENT_ID = process.env.STRIPE_CLIENT_ID || '';

export class StripeConnector extends BaseConnector {
  type: ConnectorType = 'stripe';

  getAuthUrl(orgId: string, redirectUrl: string): string {
    const params = new URLSearchParams({
      client_id: STRIPE_CLIENT_ID,
      response_type: 'code',
      scope: 'read_only',
      redirect_uri: redirectUrl,
      state: orgId,
    });

    return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(
    code: string,
    _orgId: string,
  ): Promise<ConnectorCredentials> {
    const response = await fetch(
      'https://connect.stripe.com/oauth/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Stripe OAuth failed: ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    return {
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string,
      extra: {
        stripe_user_id: data.stripe_user_id,
        stripe_publishable_key: data.stripe_publishable_key,
      },
    };
  }

  async refreshToken(connector: Connector): Promise<ConnectorCredentials> {
    const credentials = this.parseCredentials(connector);

    const response = await fetch(
      'https://connect.stripe.com/oauth/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: credentials.refresh_token || '',
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Stripe token refresh failed: ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    return {
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string,
      extra: credentials.extra,
    };
  }

  async fetchEvents(
    connector: Connector,
    cursor: SyncCursor | null,
  ): Promise<FetchEventsResult> {
    const credentials = this.parseCredentials(connector);
    const startingAfter = (cursor?.metadata?.starting_after as string) || undefined;
    const createdAfter = cursor?.cursor_value
      ? Math.floor(new Date(cursor.cursor_value).getTime() / 1000)
      : 0;

    // Fetch recent events from Stripe
    const params = new URLSearchParams({
      limit: '100',
      'created[gte]': createdAfter.toString(),
    });
    if (startingAfter) {
      params.set('starting_after', startingAfter);
    }

    const response = await fetch(
      `https://api.stripe.com/v1/events?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${credentials.access_token}` },
      },
    );

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    const events = (data.data as Array<Record<string, unknown>>) || [];
    const hasMore = data.has_more as boolean;

    const allEvents: RawEvent[] = [];
    let latestCreated = cursor?.cursor_value || '1970-01-01T00:00:00Z';

    for (const event of events) {
      const created = new Date((event.created as number) * 1000).toISOString();

      if (created > latestCreated) {
        latestCreated = created;
      }

      const eventType = event.type as string;
      const eventData = event.data as Record<string, unknown>;
      const object = eventData?.object as Record<string, unknown>;

      let content = `Stripe Event: ${eventType}`;
      if (object) {
        content += `\nObject: ${object.object || 'unknown'}`;
        if (object.amount) {
          content += `\nAmount: ${(object.amount as number) / 100} ${(object.currency as string)?.toUpperCase() || 'USD'}`;
        }
        if (object.customer) {
          content += `\nCustomer: ${object.customer}`;
        }
        if (object.description) {
          content += `\nDescription: ${object.description}`;
        }
        if (object.status) {
          content += `\nStatus: ${object.status}`;
        }
      }

      allEvents.push({
        id: uuid(),
        org_id: connector.org_id,
        connector_id: connector.id,
        connector_type: 'stripe',
        external_id: event.id as string,
        event_type: eventType,
        author_external_id: null,
        author_name: null,
        content,
        raw_payload: event,
        occurred_at: created,
        ingested_at: new Date().toISOString(),
        processed: false,
        processed_at: null,
      });
    }

    const lastEvent = events[events.length - 1];

    const nextCursor: SyncCursor = {
      id: cursor?.id || uuid(),
      connector_id: connector.id,
      cursor_type: 'stripe_created',
      cursor_value: hasMore ? (cursor?.cursor_value || latestCreated) : latestCreated,
      metadata: hasMore && lastEvent
        ? { starting_after: lastEvent.id }
        : {},
      updated_at: new Date().toISOString(),
    };

    return { events: allEvents, nextCursor, hasMore };
  }

  async testConnection(connector: Connector): Promise<boolean> {
    try {
      const credentials = this.parseCredentials(connector);
      const response = await fetch(
        'https://api.stripe.com/v1/balance',
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
    const eventId = event.external_id;
    return `https://dashboard.stripe.com/events/${eventId}`;
  }
}
