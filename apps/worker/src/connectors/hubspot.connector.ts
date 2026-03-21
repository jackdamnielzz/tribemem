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

const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID || '';
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET || '';

export class HubSpotConnector extends BaseConnector {
  type: ConnectorType = 'hubspot';

  getAuthUrl(orgId: string, redirectUrl: string): string {
    const scopes = [
      'crm.objects.contacts.read',
      'crm.objects.companies.read',
      'crm.objects.deals.read',
      'tickets',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: HUBSPOT_CLIENT_ID,
      redirect_uri: redirectUrl,
      scope: scopes,
      state: orgId,
    });

    return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(
    code: string,
    _orgId: string,
  ): Promise<ConnectorCredentials> {
    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: HUBSPOT_CLIENT_ID,
        client_secret: HUBSPOT_CLIENT_SECRET,
        code,
        redirect_uri: process.env.HUBSPOT_REDIRECT_URI || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`HubSpot OAuth failed: ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    return {
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string,
      expires_at: new Date(
        Date.now() + (data.expires_in as number) * 1000,
      ).toISOString(),
    };
  }

  async refreshToken(connector: Connector): Promise<ConnectorCredentials> {
    const credentials = this.parseCredentials(connector);

    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: HUBSPOT_CLIENT_ID,
        client_secret: HUBSPOT_CLIENT_SECRET,
        refresh_token: credentials.refresh_token || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`HubSpot token refresh failed: ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    return {
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string,
      expires_at: new Date(
        Date.now() + (data.expires_in as number) * 1000,
      ).toISOString(),
    };
  }

  async fetchEvents(
    connector: Connector,
    cursor: SyncCursor | null,
  ): Promise<FetchEventsResult> {
    const credentials = this.parseCredentials(connector);

    if (this.isTokenExpired(credentials)) {
      throw new Error('HubSpot token expired. Refresh required before fetching.');
    }

    const updatedAfter = cursor?.cursor_value
      ? new Date(cursor.cursor_value).getTime()
      : 0;
    const afterId = (cursor?.metadata?.after as string) || undefined;

    // Use CRM Search API for deals
    const response = await fetch(
      'https://api.hubapi.com/crm/v3/objects/deals/search',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'hs_lastmodifieddate',
                  operator: 'GTE',
                  value: updatedAfter.toString(),
                },
              ],
            },
          ],
          sorts: [
            {
              propertyName: 'hs_lastmodifieddate',
              direction: 'ASCENDING',
            },
          ],
          properties: [
            'dealname',
            'amount',
            'dealstage',
            'pipeline',
            'closedate',
            'hs_lastmodifieddate',
          ],
          limit: 50,
          after: afterId,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    const results = (data.results as Array<Record<string, unknown>>) || [];
    const paging = data.paging as Record<string, unknown> | undefined;
    const nextAfter = (paging?.next as Record<string, unknown>)?.after as string | undefined;
    const hasMore = !!nextAfter;

    const allEvents: RawEvent[] = [];
    let latestUpdate = cursor?.cursor_value || '1970-01-01T00:00:00Z';

    for (const deal of results) {
      const properties = deal.properties as Record<string, string>;
      const updatedAt =
        properties.hs_lastmodifieddate || new Date().toISOString();

      if (updatedAt > latestUpdate) {
        latestUpdate = updatedAt;
      }

      const content = `Deal: ${properties.dealname || 'Untitled'}\nAmount: ${properties.amount || 'N/A'}\nStage: ${properties.dealstage || 'Unknown'}\nClose Date: ${properties.closedate || 'N/A'}`;

      allEvents.push({
        id: uuid(),
        org_id: connector.org_id,
        connector_id: connector.id,
        connector_type: 'hubspot',
        external_id: deal.id as string,
        event_type: 'deal_update',
        author_external_id: null,
        author_name: null,
        content,
        raw_payload: deal,
        occurred_at: updatedAt,
        ingested_at: new Date().toISOString(),
        processed: false,
        processed_at: null,
      });
    }

    const nextCursor: SyncCursor = {
      id: cursor?.id || uuid(),
      connector_id: connector.id,
      cursor_type: 'hubspot_modified_date',
      cursor_value: hasMore ? (cursor?.cursor_value || latestUpdate) : latestUpdate,
      metadata: hasMore ? { after: nextAfter } : {},
      updated_at: new Date().toISOString(),
    };

    return { events: allEvents, nextCursor, hasMore };
  }

  async testConnection(connector: Connector): Promise<boolean> {
    try {
      const credentials = this.parseCredentials(connector);
      const response = await fetch(
        'https://api.hubapi.com/oauth/v1/access-tokens/' +
          credentials.access_token,
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  getSourceUrl(event: RawEvent): string | null {
    const dealId = event.external_id;
    return `https://app.hubspot.com/contacts/deals/${dealId}`;
  }
}
