import type { KnowledgeUnit } from '@tribemem/shared';
import type {
  ListKnowledgeParams,
  PaginatedResponse,
  KnowledgeHistory,
} from './types';
import { makeRequest } from './http';

/** Full detail view of a knowledge unit (same shape, but explicitly typed for the public API). */
export type KnowledgeUnitDetail = KnowledgeUnit;

export async function listKnowledge(
  fetchFn: typeof globalThis.fetch,
  baseUrl: string,
  apiKey: string,
  params?: ListKnowledgeParams,
): Promise<PaginatedResponse<KnowledgeUnit>> {
  const searchParams = new URLSearchParams();
  if (params) {
    if (params.page !== undefined) searchParams.set('page', String(params.page));
    if (params.per_page !== undefined) searchParams.set('per_page', String(params.per_page));
    if (params.type) searchParams.set('type', params.type);
    if (params.category) searchParams.set('category', params.category);
    if (params.status) searchParams.set('status', params.status);
    if (params.tags && params.tags.length > 0) searchParams.set('tags', params.tags.join(','));
    if (params.search) searchParams.set('search', params.search);
    if (params.sort_by) searchParams.set('sort_by', params.sort_by);
    if (params.sort_order) searchParams.set('sort_order', params.sort_order);
  }

  const qs = searchParams.toString();
  const url = `${baseUrl}/v1/knowledge${qs ? `?${qs}` : ''}`;
  return makeRequest<PaginatedResponse<KnowledgeUnit>>(fetchFn, url, apiKey);
}

export async function getKnowledge(
  fetchFn: typeof globalThis.fetch,
  baseUrl: string,
  apiKey: string,
  id: string,
): Promise<KnowledgeUnitDetail> {
  return makeRequest<KnowledgeUnitDetail>(fetchFn, `${baseUrl}/v1/knowledge/${encodeURIComponent(id)}`, apiKey);
}

export async function getKnowledgeHistory(
  fetchFn: typeof globalThis.fetch,
  baseUrl: string,
  apiKey: string,
  id: string,
): Promise<KnowledgeHistory> {
  return makeRequest<KnowledgeHistory>(fetchFn, `${baseUrl}/v1/knowledge/${encodeURIComponent(id)}/history`, apiKey);
}
