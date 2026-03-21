CREATE TABLE queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  query_text TEXT NOT NULL,
  query_type TEXT NOT NULL DEFAULT 'chat' CHECK (query_type IN ('chat', 'api', 'mcp')),
  response_text TEXT,
  knowledge_units_used UUID[] NOT NULL DEFAULT '{}',
  confidence_score NUMERIC(4, 3) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT,
  duration_ms INTEGER,
  tokens_input INTEGER,
  tokens_output INTEGER,
  model_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_queries_org_id ON queries(org_id);
CREATE INDEX idx_queries_user_id ON queries(user_id);
CREATE INDEX idx_queries_query_type ON queries(org_id, query_type);
CREATE INDEX idx_queries_created_at ON queries(org_id, created_at DESC);
CREATE INDEX idx_queries_feedback ON queries(org_id, feedback_rating) WHERE feedback_rating IS NOT NULL;
