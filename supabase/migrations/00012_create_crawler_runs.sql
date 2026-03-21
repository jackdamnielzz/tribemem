CREATE TABLE crawler_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  events_fetched INTEGER NOT NULL DEFAULT 0,
  events_new INTEGER NOT NULL DEFAULT 0,
  events_updated INTEGER NOT NULL DEFAULT 0,
  events_skipped INTEGER NOT NULL DEFAULT 0,
  knowledge_extracted INTEGER NOT NULL DEFAULT 0,
  entities_found INTEGER NOT NULL DEFAULT 0,
  relations_found INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  error_details JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crawler_runs_connector_id ON crawler_runs(connector_id);
CREATE INDEX idx_crawler_runs_org_id ON crawler_runs(org_id);
CREATE INDEX idx_crawler_runs_status ON crawler_runs(status);
CREATE INDEX idx_crawler_runs_started_at ON crawler_runs(started_at DESC);
