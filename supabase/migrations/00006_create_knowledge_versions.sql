CREATE TABLE knowledge_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_unit_id UUID NOT NULL REFERENCES knowledge_units(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'merged', 'split', 'archived', 'restored', 'confidence_change')),
  previous_content TEXT,
  new_content TEXT NOT NULL,
  previous_title TEXT,
  new_title TEXT,
  change_reason TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_versions_unit_id ON knowledge_versions(knowledge_unit_id);
CREATE INDEX idx_knowledge_versions_org_id ON knowledge_versions(org_id);
CREATE INDEX idx_knowledge_versions_change_type ON knowledge_versions(change_type);
CREATE UNIQUE INDEX idx_knowledge_versions_unit_version ON knowledge_versions(knowledge_unit_id, version_number);
