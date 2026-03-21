CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_unit_id UUID NOT NULL REFERENCES knowledge_units(id) ON DELETE CASCADE,
  raw_event_id UUID REFERENCES raw_events(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_url TEXT,
  source_title TEXT,
  source_snippet TEXT,
  source_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sources_knowledge_unit_id ON sources(knowledge_unit_id);
CREATE INDEX idx_sources_raw_event_id ON sources(raw_event_id);
CREATE INDEX idx_sources_org_id ON sources(org_id);
