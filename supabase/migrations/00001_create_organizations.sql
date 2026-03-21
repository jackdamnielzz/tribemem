CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('free', 'starter', 'growth', 'business', 'enterprise')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  settings JSONB NOT NULL DEFAULT '{"crawl_schedule":"realtime","extraction_model":"haiku","synthesis_model":"sonnet","auto_alerts":true,"retention_months":6,"allowed_channels":[],"excluded_channels":[],"excluded_patterns":[]}'::jsonb,
  usage_this_period JSONB NOT NULL DEFAULT '{"crawl_events":0,"extractions":0,"queries":0,"api_calls":0,"tokens_used":0}'::jsonb,
  usage_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_stripe ON organizations(stripe_customer_id);
