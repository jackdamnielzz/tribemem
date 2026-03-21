CREATE TABLE raw_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  source_channel TEXT,
  author_external_id TEXT,
  author_name TEXT,
  content TEXT,
  content_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  extraction_status TEXT NOT NULL DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  event_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (connector_id, external_id)
);

CREATE INDEX idx_raw_events_org_id ON raw_events(org_id);
CREATE INDEX idx_raw_events_connector_id ON raw_events(connector_id);
CREATE INDEX idx_raw_events_extraction_status ON raw_events(extraction_status);
CREATE INDEX idx_raw_events_event_type ON raw_events(org_id, event_type);
CREATE INDEX idx_raw_events_source_channel ON raw_events(org_id, source_channel);
CREATE INDEX idx_raw_events_event_timestamp ON raw_events(event_timestamp DESC);
