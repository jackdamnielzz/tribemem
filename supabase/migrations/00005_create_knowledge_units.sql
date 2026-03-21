CREATE TABLE knowledge_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('fact', 'process', 'decision', 'norm', 'definition')),
  category TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_embedding extensions.vector(1536),
  confidence_score NUMERIC(4, 3) NOT NULL DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  evidence_count INTEGER NOT NULL DEFAULT 0,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  superseded_by UUID REFERENCES knowledge_units(id) ON DELETE SET NULL,
  supersedes UUID REFERENCES knowledge_units(id) ON DELETE SET NULL,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'disputed', 'merged')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_units_org_id ON knowledge_units(org_id);
CREATE INDEX idx_knowledge_units_type ON knowledge_units(org_id, type);
CREATE INDEX idx_knowledge_units_category ON knowledge_units(org_id, category);
CREATE INDEX idx_knowledge_units_status ON knowledge_units(org_id, status);
CREATE INDEX idx_knowledge_units_is_current ON knowledge_units(org_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_knowledge_units_tags ON knowledge_units USING GIN(tags);
-- Vector index: use HNSW (works on empty tables, unlike ivfflat)
CREATE INDEX idx_knowledge_units_embedding ON knowledge_units USING hnsw (content_embedding extensions.vector_cosine_ops);
