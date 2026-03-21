import type { Connector, CrawlerRun } from '@tribemem/shared';
import type { ListCrawlerRunsParams, PaginatedResponse } from './types';
import { makeRequest } from './http';

export interface CrawlerStatusResponse {
  active_runs: number;
  queued_runs: number;
  last_completed_at: string | null;
}

export async function listConnectors(
  fetchFn: typeof globalThis.fetch,
  baseUrl: string,
  apiKey: string,
): Promise<Connector[]> {
  return makeRequest<Connector[]>(fetchFn, `${baseUrl}/v1/connectors`, apiKey);
}

export async function triggerSync(
  fetchFn: typeof globalThis.fetch,
  baseUrl: string,
  apiKey: string,
  connectorId: string,
): Promise<void> {
  await makeRequest<void>(
    fetchFn,
    `${baseUrl}/v1/connectors/${encodeURIComponent(connectorId)}/sync`,
    apiKey,
    { method: 'POST' },
  );
}

export async function getCrawlerStatus(
  fetchFn: typeof globalThis.fetch,
  baseUrl: string,
  apiKey: string,
): Promise<CrawlerStatusResponse> {
  return makeRequest<CrawlerStatusResponse>(fetchFn, `${baseUrl}/v1/crawler/status`, apiKey);
}

export async function getCrawlerRuns(
  fetchFn: typeof globalThis.fetch,
  baseUrl: string,
  apiKey: string,
  params?: ListCrawlerRunsParams,
): Promise<PaginatedResponse<CrawlerRun>> {
  const searchParams = new URLSearchParams();
  if (params) {
    if (params.page !== undefined) searchParams.set('page', String(params.page));
    if (params.per_page !== undefined) searchParams.set('per_page', String(params.per_page));
    if (params.connector_id) searchParams.set('connector_id', params.connector_id);
    if (params.status) searchParams.set('status', params.status);
  }

  const qs = searchParams.toString();
  const url = `${baseUrl}/v1/crawler/runs${qs ? `?${qs}` : ''}`;
  return makeRequest<PaginatedResponse<CrawlerRun>>(fetchFn, url, apiKey);
}
