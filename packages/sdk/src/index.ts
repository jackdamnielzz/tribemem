export { TribeMemClient } from './client';

// Types
export type {
  TribeMemClientConfig,
  PaginatedResponse,
  PaginationMeta,
  PaginationParams,
  ListKnowledgeParams,
  KnowledgeHistory,
  KnowledgeVersionEntry,
  ListEntitiesParams,
  EntityRelations,
  EntityRelationEntry,
  ListCrawlerRunsParams,
  ListAlertsParams,
  ApiErrorBody,
} from './types';

export type { SdkQueryRequest } from './query';
export type { KnowledgeUnitDetail } from './knowledge';
export type { CrawlerStatusResponse } from './connectors';

// Errors
export {
  TribeMemError,
  ApiError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  NetworkError,
} from './errors';

// Re-export shared types for convenience
export type {
  KnowledgeUnit,
  KnowledgeType,
  KnowledgeCategory,
  KnowledgeStatus,
  ConfidenceLevel,
  KnowledgeVersion,
  QueryRequest,
  QueryResponse,
  QuerySource,
  QueryFilters,
  Connector,
  ConnectorType,
  ConnectorStatus,
  CrawlerRun,
  CrawlerRunSummary,
  Entity,
  EntityType,
  EntityRelation,
  RelationType,
  Alert,
  AlertType,
  AlertSeverity,
  AlertStatus,
  AlertRule,
  Organization,
  OrganizationSettings,
  Member,
  ApiKey,
  ApiKeyScope,
  UsagePeriod,
} from '@tribemem/shared';
