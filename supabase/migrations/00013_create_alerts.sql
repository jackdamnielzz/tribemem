CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('contradiction', 'process_drift', 'knowledge_gap', 'stale_knowledge', 'connector_error', 'usage_limit')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  related_knowledge_ids UUID[] NOT NULL DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_org_id ON alerts(org_id);
CREATE INDEX idx_alerts_type ON alerts(org_id, type);
CREATE INDEX idx_alerts_severity ON alerts(org_id, severity);
CREATE INDEX idx_alerts_unread ON alerts(org_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_alerts_unresolved ON alerts(org_id, is_resolved) WHERE is_resolved = FALSE;
CREATE INDEX idx_alerts_created_at ON alerts(org_id, created_at DESC);
