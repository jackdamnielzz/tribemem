import type {
  KnowledgeUnit,
  QueryResponse,
  Connector,
  CrawlerRun,
  Entity,
  EntityRelation,
  Alert,
  Organization,
  UsagePeriod,
  ApiKey,
} from '@tribemem/shared';

import type {
  TribeMemClientConfig,
  ListKnowledgeParams,
  PaginatedResponse,
  KnowledgeHistory,
  ListEntitiesParams,
  EntityRelations,
  ListCrawlerRunsParams,
  ListAlertsParams,
} from './types';

import type { KnowledgeUnitDetail } from './knowledge';
import type { SdkQueryRequest } from './query';
import type { CrawlerStatusResponse } from './connectors';

import { executeQuery } from './query';
import { listKnowledge, getKnowledge, getKnowledgeHistory } from './knowledge';
import {
  listConnectors as listConnectorsFn,
  triggerSync as triggerSyncFn,
  getCrawlerStatus as getCrawlerStatusFn,
  getCrawlerRuns as getCrawlerRunsFn,
} from './connectors';
import { makeRequest } from './http';
import { TribeMemError } from './errors';

const DEFAULT_BASE_URL = 'https://api.tribemem.ai';

export class TribeMemClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchFn: typeof globalThis.fetch;

  constructor(config: TribeMemClientConfig) {
    if (!config.apiKey) {
      throw new TribeMemError('apiKey is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.fetchFn = config.fetch ?? globalThis.fetch.bind(globalThis);
  }

  // ---------------------------------------------------------------------------
  // Knowledge
  // ---------------------------------------------------------------------------

  async query(request: SdkQueryRequest): Promise<QueryResponse> {
    return executeQuery(this.fetchFn, this.baseUrl, this.apiKey, request);
  }

  async listKnowledge(params?: ListKnowledgeParams): Promise<PaginatedResponse<KnowledgeUnit>> {
    return listKnowledge(this.fetchFn, this.baseUrl, this.apiKey, params);
  }

  async getKnowledge(id: string): Promise<KnowledgeUnitDetail> {
    return getKnowledge(this.fetchFn, this.baseUrl, this.apiKey, id);
  }

  async getKnowledgeHistory(id: string): Promise<KnowledgeHistory> {
    return getKnowledgeHistory(this.fetchFn, this.baseUrl, this.apiKey, id);
  }

  // ---------------------------------------------------------------------------
  // Entities
  // ---------------------------------------------------------------------------

  async listEntities(params?: ListEntitiesParams): Promise<PaginatedResponse<Entity>> {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) searchParams.set('page', String(params.page));
      if (params.per_page !== undefined) searchParams.set('per_page', String(params.per_page));
      if (params.type) searchParams.set('type', params.type);
      if (params.search) searchParams.set('search', params.search);
      if (params.sort_by) searchParams.set('sort_by', params.sort_by);
      if (params.sort_order) searchParams.set('sort_order', params.sort_order);
    }
    const qs = searchParams.toString();
    const url = `${this.baseUrl}/v1/entities${qs ? `?${qs}` : ''}`;
    return makeRequest<PaginatedResponse<Entity>>(this.fetchFn, url, this.apiKey);
  }

  async getEntityRelations(id: string): Promise<EntityRelations> {
    return makeRequest<EntityRelations>(
      this.fetchFn,
      `${this.baseUrl}/v1/entities/${encodeURIComponent(id)}/relations`,
      this.apiKey,
    );
  }

  // ---------------------------------------------------------------------------
  // Connectors
  // ---------------------------------------------------------------------------

  async listConnectors(): Promise<Connector[]> {
    return listConnectorsFn(this.fetchFn, this.baseUrl, this.apiKey);
  }

  async triggerSync(connectorId: string): Promise<void> {
    return triggerSyncFn(this.fetchFn, this.baseUrl, this.apiKey, connectorId);
  }

  // ---------------------------------------------------------------------------
  // Crawler
  // ---------------------------------------------------------------------------

  async getCrawlerStatus(): Promise<CrawlerStatusResponse> {
    return getCrawlerStatusFn(this.fetchFn, this.baseUrl, this.apiKey);
  }

  async getCrawlerRuns(params?: ListCrawlerRunsParams): Promise<PaginatedResponse<CrawlerRun>> {
    return getCrawlerRunsFn(this.fetchFn, this.baseUrl, this.apiKey, params);
  }

  // ---------------------------------------------------------------------------
  // Alerts
  // ---------------------------------------------------------------------------

  async listAlerts(params?: ListAlertsParams): Promise<PaginatedResponse<Alert>> {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) searchParams.set('page', String(params.page));
      if (params.per_page !== undefined) searchParams.set('per_page', String(params.per_page));
      if (params.type) searchParams.set('type', params.type);
      if (params.severity) searchParams.set('severity', params.severity);
      if (params.status) searchParams.set('status', params.status);
    }
    const qs = searchParams.toString();
    const url = `${this.baseUrl}/v1/alerts${qs ? `?${qs}` : ''}`;
    return makeRequest<PaginatedResponse<Alert>>(this.fetchFn, url, this.apiKey);
  }

  async resolveAlert(id: string): Promise<void> {
    await makeRequest<void>(
      this.fetchFn,
      `${this.baseUrl}/v1/alerts/${encodeURIComponent(id)}/resolve`,
      this.apiKey,
      { method: 'POST' },
    );
  }

  // ---------------------------------------------------------------------------
  // Organization
  // ---------------------------------------------------------------------------

  async getOrg(): Promise<Organization> {
    return makeRequest<Organization>(this.fetchFn, `${this.baseUrl}/v1/org`, this.apiKey);
  }

  async getUsage(): Promise<UsagePeriod> {
    return makeRequest<UsagePeriod>(this.fetchFn, `${this.baseUrl}/v1/org/usage`, this.apiKey);
  }

  // ---------------------------------------------------------------------------
  // API Keys
  // ---------------------------------------------------------------------------

  async listApiKeys(): Promise<ApiKey[]> {
    return makeRequest<ApiKey[]>(this.fetchFn, `${this.baseUrl}/v1/api-keys`, this.apiKey);
  }

  async createApiKey(
    name: string,
    scopes: string[],
  ): Promise<{ key: string; apiKey: ApiKey }> {
    return makeRequest<{ key: string; apiKey: ApiKey }>(
      this.fetchFn,
      `${this.baseUrl}/v1/api-keys`,
      this.apiKey,
      { method: 'POST', body: { name, scopes } },
    );
  }

  async revokeApiKey(id: string): Promise<void> {
    await makeRequest<void>(
      this.fetchFn,
      `${this.baseUrl}/v1/api-keys/${encodeURIComponent(id)}`,
      this.apiKey,
      { method: 'DELETE' },
    );
  }
}
