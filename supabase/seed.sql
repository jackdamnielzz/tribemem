-- ============================================================================
-- TribeMem Seed Data
-- Demo organization with sample knowledge units, entities, and relations
-- ============================================================================

-- Create a demo organization
INSERT INTO organizations (id, name, slug, plan, settings)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Acme Engineering',
  'acme-engineering',
  'growth',
  '{"crawl_schedule":"realtime","extraction_model":"haiku","synthesis_model":"sonnet","auto_alerts":true,"retention_months":12,"allowed_channels":[],"excluded_channels":["#random","#watercooler"],"excluded_patterns":[]}'::jsonb
);

-- ============================================================================
-- Sample Knowledge Units (all 5 types)
-- ============================================================================

-- FACT
INSERT INTO knowledge_units (id, org_id, type, category, title, content, confidence_score, evidence_count, status, tags)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'fact',
  'Architecture',
  'Primary database is PostgreSQL 15',
  'The production system uses PostgreSQL 15 as the primary database, hosted on Supabase. All application data including user accounts, project data, and analytics are stored here. The database was migrated from MySQL in Q3 2024.',
  0.95,
  12,
  'active',
  ARRAY['database', 'infrastructure', 'postgresql']
);

-- PROCESS
INSERT INTO knowledge_units (id, org_id, type, category, title, content, confidence_score, evidence_count, status, tags)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  'process',
  'Engineering',
  'Pull request review process',
  'All pull requests require at least 2 approving reviews before merging. The author must not be one of the reviewers. CI checks must pass. For changes touching the payments module, a review from the security team is also required. PRs should be kept under 400 lines of changes when possible.',
  0.88,
  25,
  'active',
  ARRAY['engineering', 'code-review', 'process', 'git']
);

-- DECISION
INSERT INTO knowledge_units (id, org_id, type, category, title, content, confidence_score, evidence_count, status, tags)
VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  'decision',
  'Architecture',
  'Adopted Next.js as the frontend framework',
  'The team decided to adopt Next.js 14 (App Router) as the primary frontend framework, replacing the legacy Create React App setup. Key reasons: better SEO with server-side rendering, improved performance with React Server Components, and built-in API routes reducing backend complexity. Decision made on 2024-06-15 during the architecture review meeting.',
  0.92,
  8,
  'active',
  ARRAY['frontend', 'architecture', 'nextjs', 'decision']
);

-- NORM
INSERT INTO knowledge_units (id, org_id, type, category, title, content, confidence_score, evidence_count, status, tags)
VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '11111111-1111-1111-1111-111111111111',
  'norm',
  'Culture',
  'Async-first communication policy',
  'The team follows an async-first communication approach. Non-urgent matters should be communicated via Slack channels (not DMs). Meetings should have an agenda shared at least 24 hours in advance. Decisions made in meetings must be documented in the relevant Slack channel. Response time expectations: urgent = 1 hour, normal = 4 hours, low priority = 24 hours.',
  0.85,
  18,
  'active',
  ARRAY['communication', 'culture', 'async', 'meetings']
);

-- DEFINITION
INSERT INTO knowledge_units (id, org_id, type, category, title, content, confidence_score, evidence_count, status, tags)
VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '11111111-1111-1111-1111-111111111111',
  'definition',
  'Domain',
  'Definition of "Tribal Knowledge"',
  'Tribal knowledge refers to the informal, undocumented information that exists within an organization, typically shared through conversations, Slack messages, meetings, and informal interactions. It includes institutional context, unwritten rules, historical decisions and their rationale, known workarounds, and interpersonal dynamics that affect how work gets done.',
  0.98,
  30,
  'active',
  ARRAY['definition', 'tribal-knowledge', 'core-concept']
);

-- An archived/superseded knowledge unit
INSERT INTO knowledge_units (id, org_id, type, category, title, content, confidence_score, evidence_count, is_current, superseded_by, status, tags, valid_until)
VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  '11111111-1111-1111-1111-111111111111',
  'fact',
  'Architecture',
  'Primary database is MySQL 8',
  'The production system uses MySQL 8 as the primary database. All application data is stored here.',
  0.40,
  5,
  FALSE,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'archived',
  ARRAY['database', 'infrastructure', 'mysql'],
  '2024-09-01T00:00:00Z'
);

-- ============================================================================
-- Sample Knowledge Versions
-- ============================================================================

INSERT INTO knowledge_versions (id, knowledge_unit_id, org_id, version_number, change_type, new_content, new_title, change_reason)
VALUES (
  '11111111-aaaa-bbbb-cccc-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  1,
  'created',
  'The production system uses PostgreSQL 15 as the primary database, hosted on Supabase. All application data including user accounts, project data, and analytics are stored here. The database was migrated from MySQL in Q3 2024.',
  'Primary database is PostgreSQL 15',
  'Extracted from #engineering channel discussion about the database migration completion'
);

INSERT INTO knowledge_versions (id, knowledge_unit_id, org_id, version_number, change_type, previous_content, new_content, previous_title, new_title, change_reason)
VALUES (
  '22222222-aaaa-bbbb-cccc-222222222222',
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  '11111111-1111-1111-1111-111111111111',
  2,
  'archived',
  'The production system uses MySQL 8 as the primary database. All application data is stored here.',
  'The production system uses MySQL 8 as the primary database. All application data is stored here.',
  'Primary database is MySQL 8',
  'Primary database is MySQL 8',
  'Superseded by PostgreSQL 15 migration - this knowledge unit is no longer current'
);

-- ============================================================================
-- Sample Entities
-- ============================================================================

INSERT INTO entities (id, org_id, type, name, aliases, description, mention_count)
VALUES
  ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'person', 'Sarah Chen', ARRAY['sarah', 'schen'], 'Engineering lead, backend specialist', 45),
  ('e2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'person', 'Marcus Johnson', ARRAY['marcus', 'mj'], 'Senior frontend developer', 32),
  ('e3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'team', 'Platform Team', ARRAY['platform', 'infra team'], 'Responsible for infrastructure, CI/CD, and developer tooling', 28),
  ('e4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'tool', 'PostgreSQL', ARRAY['postgres', 'pg', 'psql'], 'Primary relational database', 60),
  ('e5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'tool', 'Next.js', ARRAY['nextjs', 'next'], 'React framework for frontend', 40),
  ('e6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'project', 'Dashboard Redesign', ARRAY['dashboard v2', 'new dashboard'], 'Q1 2025 project to redesign the analytics dashboard', 22),
  ('e7777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'system', 'Payment Service', ARRAY['payments', 'billing service', 'stripe integration'], 'Handles all payment processing via Stripe', 18),
  ('e8888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'channel', '#engineering', ARRAY['engineering channel'], 'Main engineering discussion channel', 95),
  ('e9999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'client', 'TechCorp', ARRAY['techcorp', 'TC'], 'Enterprise client, largest account', 15),
  ('ea000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'process', 'Sprint Planning', ARRAY['sprint plan', 'planning ceremony'], 'Bi-weekly sprint planning process', 35);

-- ============================================================================
-- Sample Entity Relations
-- ============================================================================

INSERT INTO entity_relations (id, org_id, source_entity_id, target_entity_id, relation_type, strength, evidence_count)
VALUES
  -- Sarah Chen leads the Platform Team
  ('r1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'e1111111-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333',
   'leads', 0.95, 15),

  -- Marcus Johnson works on Dashboard Redesign
  ('r2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'e2222222-2222-2222-2222-222222222222', 'e6666666-6666-6666-6666-666666666666',
   'works_on', 0.90, 10),

  -- Platform Team owns PostgreSQL
  ('r3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
   'e3333333-3333-3333-3333-333333333333', 'e4444444-4444-4444-4444-444444444444',
   'owns', 0.85, 8),

  -- Dashboard Redesign uses Next.js
  ('r4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111',
   'e6666666-6666-6666-6666-666666666666', 'e5555555-5555-5555-5555-555555555555',
   'uses', 0.92, 12),

  -- Payment Service depends on PostgreSQL
  ('r5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111',
   'e7777777-7777-7777-7777-777777777777', 'e4444444-4444-4444-4444-444444444444',
   'depends_on', 0.88, 6),

  -- Sarah Chen communicates in #engineering
  ('r6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111',
   'e1111111-1111-1111-1111-111111111111', 'e8888888-8888-8888-8888-888888888888',
   'communicates_in', 0.80, 40),

  -- Dashboard Redesign is for TechCorp
  ('r7777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111',
   'e6666666-6666-6666-6666-666666666666', 'e9999999-9999-9999-9999-999999999999',
   'built_for', 0.70, 4),

  -- Marcus Johnson collaborates with Sarah Chen
  ('r8888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111',
   'e2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111',
   'collaborates_with', 0.82, 20),

  -- Platform Team participates in Sprint Planning
  ('r9999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111',
   'e3333333-3333-3333-3333-333333333333', 'ea000000-0000-0000-0000-000000000000',
   'participates_in', 0.75, 14);

-- ============================================================================
-- Sample Sources (linking knowledge units to their origins)
-- ============================================================================

INSERT INTO sources (id, knowledge_unit_id, org_id, source_url, source_title, source_snippet, source_timestamp)
VALUES
  ('s1111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '11111111-1111-1111-1111-111111111111',
   'https://acme.slack.com/archives/C01ENGINEERING/p1695000000',
   '#engineering - Database Migration Complete',
   'Hey team, the PostgreSQL 15 migration is officially done! All services are now pointing to the new Supabase instance.',
   '2024-09-15T10:30:00Z'),

  ('s2222222-2222-2222-2222-222222222222',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '11111111-1111-1111-1111-111111111111',
   'https://acme.slack.com/archives/C01ENGINEERING/p1690000000',
   '#engineering - Updated PR Review Guidelines',
   'Following last week''s retro, we''re updating the PR review process: minimum 2 approvals required, and security team review for payment changes.',
   '2024-07-22T14:00:00Z'),

  ('s3333333-3333-3333-3333-333333333333',
   'cccccccc-cccc-cccc-cccc-cccccccccccc',
   '11111111-1111-1111-1111-111111111111',
   'https://acme.slack.com/archives/C01ENGINEERING/p1718400000',
   '#engineering - Architecture Review: Frontend Framework',
   'After evaluating Remix, Astro, and Next.js, we''re going with Next.js 14 App Router. The RSC model aligns well with our data-heavy dashboard.',
   '2024-06-15T09:00:00Z');

-- ============================================================================
-- Sample Alerts
-- ============================================================================

INSERT INTO alerts (id, org_id, type, severity, title, description, related_knowledge_ids, is_read)
VALUES
  ('a1111111-1111-1111-1111-111111111111',
   '11111111-1111-1111-1111-111111111111',
   'stale_knowledge',
   'low',
   'Knowledge unit may be outdated',
   'The knowledge unit "Primary database is MySQL 8" has not been referenced in over 90 days and may contain outdated information.',
   ARRAY['ffffffff-ffff-ffff-ffff-ffffffffffff']::uuid[],
   TRUE),

  ('a2222222-2222-2222-2222-222222222222',
   '11111111-1111-1111-1111-111111111111',
   'contradiction',
   'high',
   'Conflicting information about database technology',
   'Two knowledge units contain contradictory information about the primary database: one says MySQL 8, the other says PostgreSQL 15. This has been resolved by archiving the MySQL reference.',
   ARRAY['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ffffffff-ffff-ffff-ffff-ffffffffffff']::uuid[],
   TRUE);
