CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('person', 'team', 'system', 'tool', 'process', 'client', 'project', 'concept', 'channel', 'repository', 'other')),
  name TEXT NOT NULL,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  mention_count INTEGER NOT NULL DEFAULT 0,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, type, name)
);

CREATE INDEX idx_entities_org_id ON entities(org_id);
CREATE INDEX idx_entities_type ON entities(org_id, type);
CREATE INDEX idx_entities_name ON entities(org_id, name);
CREATE INDEX idx_entities_aliases ON entities USING GIN(aliases);
CREATE INDEX idx_entities_mention_count ON entities(org_id, mention_count DESC);
