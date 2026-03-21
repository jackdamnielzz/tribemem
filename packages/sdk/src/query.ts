import type { QueryResponse } from '@tribemem/shared';
import type { ApiErrorBody } from './types';
import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  RateLimitError,
} from './errors';

/** Simplified query request for the SDK (org_id/user_id are derived server-side from the API key). */
export interface SdkQueryRequest {
  query: string;
  categories?: string[];
  types?: string[];
  tags?: string[];
  min_confidence?: number;
  date_from?: string;
  date_to?: string;
  max_results?: number;
  include_related?: boolean;
}

export async function executeQuery(
  fetchFn: typeof globalThis.fetch,
  baseUrl: string,
  apiKey: string,
  request: SdkQueryRequest,
): Promise<QueryResponse> {
  const body = {
    query: request.query,
    filters: {
      ...(request.categories && { categories: request.categories }),
      ...(request.types && { types: request.types }),
      ...(request.tags && { tags: request.tags }),
      ...(request.min_confidence !== undefined && { min_confidence: request.min_confidence }),
      ...(request.date_from && { date_from: request.date_from }),
      ...(request.date_to && { date_to: request.date_to }),
    },
    ...(request.max_results !== undefined && { max_results: request.max_results }),
    ...(request.include_related !== undefined && { include_related: request.include_related }),
  };

  let response: Response;
  try {
    response = await fetchFn(`${baseUrl}/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new NetworkError('Failed to reach TribeMem API', err);
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({
      error: 'unknown',
      message: response.statusText,
      status: response.status,
    }))) as ApiErrorBody;

    switch (response.status) {
      case 401:
        throw new AuthenticationError(errorBody);
      case 403:
        throw new AuthorizationError(errorBody);
      case 429: {
        const retryAfter = response.headers.get('retry-after');
        throw new RateLimitError(
          errorBody,
          retryAfter ? parseInt(retryAfter, 10) * 1000 : null,
        );
      }
      default:
        throw new ApiError(response.status, errorBody);
    }
  }

  return (await response.json()) as QueryResponse;
}
