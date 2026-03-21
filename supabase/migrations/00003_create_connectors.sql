CREATE TABLE connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('slack', 'discord', 'teams', 'github', 'gitlab', 'jira', 'confluence', 'notion', 'linear', 'google_drive', 'custom_webhook')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'error', 'revoked')),
  encrypted_access_token TEXT,
  encrypted_refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  sync_cursor TEXT,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  events_total INTEGER NOT NULL DEFAULT 0,
  events_processed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, type)
);

CREATE INDEX idx_connectors_org_id ON connectors(org_id);
CREATE INDEX idx_connectors_status ON connectors(status);
CREATE INDEX idx_connectors_type ON connectors(org_id, type);
