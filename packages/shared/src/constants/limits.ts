import type { PlanId } from '../types/billing';

/**
 * Rate limits per plan (requests per window).
 */
export interface RateLimitConfig {
  /** Maximum requests in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export interface PlanRateLimits {
  /** Rate limit for query API endpoints */
  query: RateLimitConfig;
  /** Rate limit for general API endpoints */
  api: RateLimitConfig;
  /** Rate limit for webhook ingestion endpoints */
  webhook: RateLimitConfig;
}

export const RATE_LIMITS: Record<PlanId, PlanRateLimits> = {
  free: {
    query: { maxRequests: 5, windowSeconds: 60 },
    api: { maxRequests: 30, windowSeconds: 60 },
    webhook: { maxRequests: 10, windowSeconds: 60 },
  },
  starter: {
    query: { maxRequests: 20, windowSeconds: 60 },
    api: { maxRequests: 120, windowSeconds: 60 },
    webhook: { maxRequests: 50, windowSeconds: 60 },
  },
  growth: {
    query: { maxRequests: 60, windowSeconds: 60 },
    api: { maxRequests: 300, windowSeconds: 60 },
    webhook: { maxRequests: 200, windowSeconds: 60 },
  },
  business: {
    query: { maxRequests: 200, windowSeconds: 60 },
    api: { maxRequests: 1000, windowSeconds: 60 },
    webhook: { maxRequests: 500, windowSeconds: 60 },
  },
  enterprise: {
    query: { maxRequests: 1000, windowSeconds: 60 },
    api: { maxRequests: 5000, windowSeconds: 60 },
    webhook: { maxRequests: 2000, windowSeconds: 60 },
  },
};

/**
 * Monthly quota limits per plan.
 */
export interface MonthlyQuotas {
  /** Maximum queries per month */
  queries: number | null;
  /** Maximum knowledge units */
  knowledgeUnits: number | null;
  /** Maximum connectors */
  connectors: number | null;
  /** Maximum team members */
  members: number | null;
  /** Maximum API keys */
  apiKeys: number | null;
  /** Maximum crawler runs per day */
  crawlRunsPerDay: number | null;
  /** Data retention in days (null = unlimited) */
  retentionDays: number | null;
}

export const MONTHLY_QUOTAS: Record<PlanId, MonthlyQuotas> = {
  free: {
    queries: 50,
    knowledgeUnits: 500,
    connectors: 1,
    members: 3,
    apiKeys: 1,
    crawlRunsPerDay: 1,
    retentionDays: 30,
  },
  starter: {
    queries: 500,
    knowledgeUnits: 5000,
    connectors: 3,
    members: 10,
    apiKeys: 5,
    crawlRunsPerDay: 5,
    retentionDays: 90,
  },
  growth: {
    queries: 2000,
    knowledgeUnits: 25000,
    connectors: 8,
    members: 50,
    apiKeys: 20,
    crawlRunsPerDay: 20,
    retentionDays: 365,
  },
  business: {
    queries: 10000,
    knowledgeUnits: null,
    connectors: null,
    members: 200,
    apiKeys: 100,
    crawlRunsPerDay: null,
    retentionDays: null,
  },
  enterprise: {
    queries: null,
    knowledgeUnits: null,
    connectors: null,
    members: null,
    apiKeys: null,
    crawlRunsPerDay: null,
    retentionDays: null,
  },
};

/**
 * General system limits that apply regardless of plan.
 */
export const SYSTEM_LIMITS = {
  /** Maximum length of a query string */
  MAX_QUERY_LENGTH: 2000,
  /** Maximum length of a knowledge unit title */
  MAX_TITLE_LENGTH: 500,
  /** Maximum length of knowledge unit content */
  MAX_CONTENT_LENGTH: 50000,
  /** Maximum number of tags per knowledge unit */
  MAX_TAGS_PER_UNIT: 20,
  /** Maximum length of a single tag */
  MAX_TAG_LENGTH: 50,
  /** Maximum number of filters in a query */
  MAX_QUERY_FILTERS: 10,
  /** Maximum results returned per page */
  MAX_PAGE_SIZE: 100,
  /** Default results returned per page */
  DEFAULT_PAGE_SIZE: 20,
  /** Maximum raw event payload size in bytes */
  MAX_EVENT_PAYLOAD_BYTES: 1_048_576,
  /** Maximum number of entities per extracted fact */
  MAX_ENTITIES_PER_FACT: 20,
  /** Minimum confidence score (0-1) */
  MIN_CONFIDENCE_SCORE: 0,
  /** Maximum confidence score (0-1) */
  MAX_CONFIDENCE_SCORE: 1,
  /** API key length in bytes (before base64 encoding) */
  API_KEY_BYTES: 32,
  /** Invitation token expiry in hours */
  INVITATION_EXPIRY_HOURS: 72,
  /** Usage limit warning threshold (percentage) */
  USAGE_WARNING_THRESHOLD: 0.8,
} as const;

/**
 * Returns the rate limit config for a given plan and endpoint category.
 */
export function getRateLimit(
  planId: PlanId,
  category: keyof PlanRateLimits,
): RateLimitConfig {
  return RATE_LIMITS[planId][category];
}

/**
 * Returns the monthly quotas for a given plan.
 */
export function getMonthlyQuotas(planId: PlanId): MonthlyQuotas {
  return MONTHLY_QUOTAS[planId];
}
