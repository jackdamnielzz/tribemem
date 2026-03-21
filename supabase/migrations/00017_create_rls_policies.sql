-- ============================================================================
-- Row Level Security Policies
-- Users can only access data for organizations they are a member of.
-- ============================================================================

-- Helper function: check if the current user is a member of the given org
CREATE OR REPLACE FUNCTION public.is_member_of(org UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE members.org_id = org
      AND members.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if the current user has a specific role (or higher) in the org
CREATE OR REPLACE FUNCTION public.has_role_in(org UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE members.org_id = org
      AND members.user_id = auth.uid()
      AND members.role IN (
        CASE required_role
          WHEN 'viewer' THEN 'owner'
          WHEN 'member' THEN 'owner'
          WHEN 'admin' THEN 'owner'
          ELSE NULL
        END,
        CASE required_role
          WHEN 'viewer' THEN 'admin'
          WHEN 'member' THEN 'admin'
          ELSE NULL
        END,
        CASE required_role
          WHEN 'viewer' THEN 'member'
          ELSE NULL
        END,
        required_role
      )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view their organizations"
  ON organizations FOR SELECT
  USING (public.is_member_of(id));

CREATE POLICY "owners and admins can update their organizations"
  ON organizations FOR UPDATE
  USING (public.has_role_in(id, 'admin'));

-- Allow authenticated users to create organizations (they become owner via trigger/app logic)
CREATE POLICY "authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "owners can delete organizations"
  ON organizations FOR DELETE
  USING (public.has_role_in(id, 'owner'));

-- ============================================================================
-- MEMBERS
-- ============================================================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view org members"
  ON members FOR SELECT
  USING (public.is_member_of(org_id));

CREATE POLICY "admins can insert members"
  ON members FOR INSERT
  WITH CHECK (public.has_role_in(org_id, 'admin'));

CREATE POLICY "admins can update members"
  ON members FOR UPDATE
  USING (public.has_role_in(org_id, 'admin'));

CREATE POLICY "admins can delete members"
  ON members FOR DELETE
  USING (public.has_role_in(org_id, 'admin'));

-- ============================================================================
-- CONNECTORS
-- ============================================================================
ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view connectors"
  ON connectors FOR SELECT
  USING (public.is_member_of(org_id));

CREATE POLICY "admins can insert connectors"
  ON connectors FOR INSERT
  WITH CHECK (public.has_role_in(org_id, 'admin'));

CREATE POLICY "admins can update connectors"
  ON connectors FOR UPDATE
  USING (public.has_role_in(org_id, 'admin'));

CREATE POLICY "admins can delete connectors"
  ON connectors FOR DELETE
  USING (public.has_role_in(org_id, 'admin'));

-- ============================================================================
-- RAW EVENTS
-- ============================================================================
ALTER TABLE raw_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view raw events"
  ON raw_events FOR SELECT
  USING (public.is_member_of(org_id));

CREATE POLICY "members can insert raw events"
  ON raw_events FOR INSERT
  WITH CHECK (public.is_member_of(org_id));

CREATE POLICY "members can update raw events"
  ON raw_events FOR UPDATE
  USING (public.is_member_of(org_id));

CREATE POLICY "admins can delete raw events"
  ON raw_events FOR DELETE
  USING (public.has_role_in(org_id, 'admin'));

-- ============================================================================
-- KNOWLEDGE UNITS
-- ============================================================================
ALTER TABLE knowledge_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view knowledge units"
  ON knowledge_units FOR SELECT
  USING (public.is_member_of(org_id));

CREATE POLICY "members can insert knowledge units"
  ON knowledge_units FOR INSERT
  WITH CHECK (public.is_member_of(org_id));

CREATE POLICY "members can update knowledge units"
  ON knowledge_units FOR UPDATE
  USING (public.is_member_of(org_id));

CREATE POLICY "admins can delete knowledge units"
  ON knowledge_units FOR DELETE
  USING (public.has_role_in(org_id, 'admin'));

-- ============================================================================
-- KNOWLEDGE VERSIONS
-- ============================================================================
ALTER TABLE knowledge_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view knowledge versions"
  ON knowledge_versions FOR SELECT
  USING (public.is_member_of(org_id));

CREATE POLICY "members can insert knowledge versions"
  ON knowledge_versions FOR INSERT
  WITH CHECK (public.is_member_of(org_id));

-- Versions are append-only: no update or delete for regular users
CREATE POLICY "no one updates knowledge versions"
  ON knowledge_versions FOR UPDATE
  USING (FALSE);

CREATE POLICY "admins can delete knowledge versions"
  ON knowledge_versions FOR DELETE
  USING (public.has_role_in(org_id, 'admin'));

-- ============================================================================
-- ENTITIES
-- ============================================================================
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view entities"
  ON entities FOR SELECT
  USING (public.is_member_of(org_id));

CREATE POLICY "members can insert entities"
  ON entities FOR INSERT
  WITH CHECK (public.is_member_of(org_id));

CREATE POLICY "members can update entities"
  ON entities FOR UPDATE
  USING (public.is_member_of(org_id));

CREATE POLICY "admins can delete entities"
  ON entities FOR DELETE
  USING (public.has_role_in(org_id, 'admin'));

-- ============================================================================
-- ENTITY RELATIONS
-- ============================================================================
ALTER TABLE entity_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view entity relations"
  ON entity_relations FOR SELECT
  USING (public.is_member_of(org_id));

CREATE POLICY "members can insert entity relations"
  ON entity_relations FOR INSERT
  WITH CHECK (public.is_member_of(org_id));

CREATE POLICY "members can update entity relations"
  ON entity_relations FOR UPDATE
  USING (public.is_member_of(org_id));

CREATE POLICY "admins can delete entity relations"
  ON entity_relations FOR DELETE
  USING (public.has_role_in(org_id, 'admin'));

-- ============================================================================
-- SOURCES
-- ============================================================================
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view sources"
  ON sources FOR SELECT
  USING (public.is_member_of(org_id));

CREATE POLICY "members can insert sources"
  ON sources FOR INSERT
  WITH CHECK (public.is_member_of(org_id));

CREATE POLICY "members can update sources"
  ON sources FOR UPDATE
  USING (public.is_member_of(org_id));

CREATE POLICY "admins can delete sources"
  ON sources FOR DELETE
  USING (public.has_role_in(org_id, 'admin'));

-- ============================================================================
-- QUERIES
-- ============================================================================
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view queries"
  ON queries FOR SELECT
  USING (public.is_member_of(org_id));

CREATE POLICY "members can insert queries"
  ON queries FOR INSERT
  WITH CHECK (public.is_member_of(org_id));

CREATE POLICY "users can update their own queries"
  ON queries FOR UPDATE
  USING (public.is_member_of(org_id) AND (user_id = auth.uid() OR public.has_role_in(org_id, 'admin')));

CREATE POLICY "admins can delete queries"
  ON queries FOR DELETE
  USING (public.has_role_in(org_id, 'admin'));

-- ============================================================================
-- API KEYS
-- ============================================================================
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view api keys"
  ON api_keys FOR SELECT
  USING (public.is_member_of(org_id));

CREATE POLICY "admins can insert api keys"
  ON api_keys FOR INSERT
  WITH CHECK (public.has_role_in(org_id, 'admin'));

CREATE POLICY "admins can update api keys"
  ON api_keys FOR UPDATE
  USING (public.has_role_in(org_id, 'admin'));

CREATE POLICY "admins can delete api keys"
  ON api_keys FOR DELETE
  USING (public.has_role_in(org_id, 'admin'));

-- ============================================================================
-- CRAWLER RUNS
-- ============================================================================
ALTER TABLE crawler_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view crawler runs"
  ON crawler_runs FOR SELECT
  USING (public.is_member_of(org_id));

CREATE POLICY "members can insert crawler runs"
  ON crawler_runs FOR INSERT
  WITH CHECK (public.is_member_of(org_id));

CREATE POLICY "members can update crawler runs"
  ON crawler_runs FOR UPDATE
  USING (public.is_member_of(org_id));

CREATE POLICY "admins can delete crawler runs"
  ON crawler_runs FOR DELETE
  USING (public.has_role_in(org_id, 'admin'));

-- ============================================================================
-- ALERTS
-- ============================================================================
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view alerts"
  ON alerts FOR SELECT
  USING (public.is_member_of(org_id));

CREATE POLICY "members can insert alerts"
  ON alerts FOR INSERT
  WITH CHECK (public.is_member_of(org_id));

CREATE POLICY "members can update alerts"
  ON alerts FOR UPDATE
  USING (public.is_member_of(org_id));

CREATE POLICY "admins can delete alerts"
  ON alerts FOR DELETE
  USING (public.has_role_in(org_id, 'admin'));

-- ============================================================================
-- BILLING EVENTS
-- ============================================================================
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can view billing events"
  ON billing_events FOR SELECT
  USING (public.has_role_in(org_id, 'admin'));

CREATE POLICY "system can insert billing events"
  ON billing_events FOR INSERT
  WITH CHECK (public.has_role_in(org_id, 'admin'));

-- Billing events are append-only
CREATE POLICY "no one updates billing events"
  ON billing_events FOR UPDATE
  USING (FALSE);

CREATE POLICY "no one deletes billing events"
  ON billing_events FOR DELETE
  USING (FALSE);
