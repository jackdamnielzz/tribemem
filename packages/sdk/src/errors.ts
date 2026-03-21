import type { ApiErrorBody } from './types';

/**
 * Base error class for all TribeMem SDK errors.
 */
export class TribeMemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TribeMemError';
  }
}

/**
 * Thrown when the API returns an error HTTP status code.
 */
export class ApiError extends TribeMemError {
  public readonly status: number;
  public readonly errorCode: string;
  public readonly details?: Record<string, unknown>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || body.error || `API error ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = body.error;
    this.details = body.details;
  }
}

/**
 * Thrown when the API key is missing or invalid.
 */
export class AuthenticationError extends ApiError {
  constructor(body: ApiErrorBody) {
    super(401, body);
    this.name = 'AuthenticationError';
  }
}

/**
 * Thrown when the user does not have the required permissions.
 */
export class AuthorizationError extends ApiError {
  constructor(body: ApiErrorBody) {
    super(403, body);
    this.name = 'AuthorizationError';
  }
}

/**
 * Thrown when the requested resource is not found.
 */
export class NotFoundError extends ApiError {
  constructor(body: ApiErrorBody) {
    super(404, body);
    this.name = 'NotFoundError';
  }
}

/**
 * Thrown when the request is rate-limited.
 */
export class RateLimitError extends ApiError {
  public readonly retryAfterMs: number | null;

  constructor(body: ApiErrorBody, retryAfterMs: number | null) {
    super(429, body);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Thrown when a network error occurs (e.g., DNS resolution failure, timeout).
 */
export class NetworkError extends TribeMemError {
  public readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'NetworkError';
    this.cause = cause;
  }
}
