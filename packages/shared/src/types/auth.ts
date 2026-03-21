import type { PlanId } from './billing';

export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export type ApiKeyScope =
  | 'query:read'
  | 'knowledge:read'
  | 'knowledge:write'
  | 'connectors:read'
  | 'connectors:write'
  | 'members:read'
  | 'members:write'
  | 'billing:read'
  | 'billing:write'
  | 'alerts:read'
  | 'alerts:write';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan_id: PlanId;
  logo_url: string | null;
  settings: OrganizationSettings;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  default_language: string;
  pii_detection_enabled: boolean;
  auto_archive_days: number | null;
  notification_email: string | null;
  allowed_domains: string[];
}

export interface Member {
  id: string;
  org_id: string;
  user_id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: MemberRole;
  last_active_at: string | null;
  invited_by: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  org_id: string;
  name: string;
  /** The key prefix for identification (e.g., "tm_live_abc12") */
  key_prefix: string;
  /** SHA-256 hash of the full key */
  key_hash: string;
  scopes: ApiKeyScope[];
  created_by: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface Invitation {
  id: string;
  org_id: string;
  email: string;
  role: MemberRole;
  invited_by: string;
  token_hash: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}
