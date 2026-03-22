-- Add missing connector types and columns needed by the OAuth callback handler.

-- 1. Expand the type CHECK constraint to include all supported connectors
ALTER TABLE connectors DROP CONSTRAINT IF EXISTS connectors_type_check;
ALTER TABLE connectors ADD CONSTRAINT connectors_type_check CHECK (
  type IN (
    'slack', 'discord', 'teams', 'github', 'gitlab', 'jira', 'confluence',
    'notion', 'linear', 'google_drive', 'custom_webhook',
    'intercom', 'hubspot', 'stripe', 'zendesk', 'freshdesk'
  )
);

-- 2. Add columns used by the OAuth callback (credentials_encrypted stores the
--    full encrypted JSON blob including access_token, refresh_token, extras).
ALTER TABLE connectors ADD COLUMN IF NOT EXISTS credentials_encrypted TEXT;
ALTER TABLE connectors ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE connectors ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
