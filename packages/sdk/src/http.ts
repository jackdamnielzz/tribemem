import type { ApiErrorBody } from './types';
import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  NetworkError,
  RateLimitError,
} from './errors';

export interface RequestOptions {
  method?: string;
  body?: unknown;
}

/**
 * Shared authenticated request helper. Handles error mapping to typed errors.
 */
export async function makeRequest<T>(
  fetchFn: typeof globalThis.fetch,
  url: string,
  apiKey: string,
  options?: RequestOptions,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };

  const init: RequestInit = {
    method: options?.method ?? 'GET',
    headers,
  };

  if (options?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetchFn(url, init);
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
      case 404:
        throw new NotFoundError(errorBody);
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

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
