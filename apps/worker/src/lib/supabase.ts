import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let client: SupabaseClient | null = null;

/**
 * Returns a Supabase client using the service role key.
 * This bypasses RLS and should only be used in the worker.
 */
export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables',
    );
  }

  client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
}

// ---------------------------------------------------------------------------
// Helper functions for common DB operations
// ---------------------------------------------------------------------------

export async function getConnectorById(connectorId: string) {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('connectors')
    .select('*')
    .eq('id', connectorId)
    .single();

  if (error) throw new Error(`Failed to fetch connector: ${error.message}`);
  return data;
}

export async function updateConnectorStatus(
  connectorId: string,
  status: string,
  extra: Record<string, unknown> = {},
) {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('connectors')
    .update({ status, updated_at: new Date().toISOString(), ...extra })
    .eq('id', connectorId);

  if (error) throw new Error(`Failed to update connector status: ${error.message}`);
}

export async function insertRawEvents(
  events: Array<Record<string, unknown>>,
): Promise<string[]> {
  if (events.length === 0) return [];
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('raw_events')
    .upsert(events, { onConflict: 'connector_id,external_id' })
    .select('id');

  if (error) throw new Error(`Failed to insert raw events: ${error.message}`);
  return (data ?? []).map((r) => r.id);
}

export async function markRawEventsProcessed(ids: string[]) {
  if (ids.length === 0) return;
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('raw_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .in('id', ids);

  if (error) throw new Error(`Failed to mark events processed: ${error.message}`);
}

export async function getRawEventsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('raw_events')
    .select('*')
    .in('id', ids);

  if (error) throw new Error(`Failed to fetch raw events: ${error.message}`);
  return data ?? [];
}

export async function upsertSyncCursor(
  connectorId: string,
  cursorType: string,
  cursorValue: string,
  metadata: Record<string, unknown> = {},
) {
  const sb = getSupabaseClient();
  const { error } = await sb.from('sync_cursors').upsert(
    {
      connector_id: connectorId,
      cursor_type: cursorType,
      cursor_value: cursorValue,
      metadata,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'connector_id,cursor_type' },
  );

  if (error) throw new Error(`Failed to upsert sync cursor: ${error.message}`);
}

export async function getSyncCursors(connectorId: string) {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('sync_cursors')
    .select('*')
    .eq('connector_id', connectorId);

  if (error) throw new Error(`Failed to fetch sync cursors: ${error.message}`);
  return data ?? [];
}

export async function createCrawlerRun(run: Record<string, unknown>) {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('crawler_runs')
    .insert(run)
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create crawler run: ${error.message}`);
  return data.id as string;
}

export async function updateCrawlerRun(
  runId: string,
  updates: Record<string, unknown>,
) {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('crawler_runs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', runId);

  if (error) throw new Error(`Failed to update crawler run: ${error.message}`);
}

export async function insertKnowledgeUnit(unit: Record<string, unknown>) {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('knowledge_units')
    .insert(unit)
    .select('id')
    .single();

  if (error) throw new Error(`Failed to insert knowledge unit: ${error.message}`);
  return data.id as string;
}

export async function updateKnowledgeUnit(
  id: string,
  updates: Record<string, unknown>,
) {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('knowledge_units')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(`Failed to update knowledge unit: ${error.message}`);
}

export async function insertEntity(entity: Record<string, unknown>) {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('entities')
    .insert(entity)
    .select('id')
    .single();

  if (error) throw new Error(`Failed to insert entity: ${error.message}`);
  return data.id as string;
}

export async function findEntitiesByOrgId(orgId: string) {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('entities')
    .select('*')
    .eq('org_id', orgId);

  if (error) throw new Error(`Failed to fetch entities: ${error.message}`);
  return data ?? [];
}

export async function insertAlert(alert: Record<string, unknown>) {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('alerts')
    .insert(alert)
    .select('id')
    .single();

  if (error) throw new Error(`Failed to insert alert: ${error.message}`);
  return data.id as string;
}

export async function insertSourceLink(link: Record<string, unknown>) {
  const sb = getSupabaseClient();
  const { error } = await sb.from('source_links').insert(link);

  if (error) throw new Error(`Failed to insert source link: ${error.message}`);
}

export async function incrementOrgUsage(
  orgId: string,
  field: string,
  amount: number = 1,
) {
  const sb = getSupabaseClient();
  const { error } = await sb.rpc('increment_usage', {
    p_org_id: orgId,
    p_field: field,
    p_amount: amount,
  });

  // Non-critical: log but don't throw
  if (error) {
    console.warn(`Failed to increment org usage (${field}):`, error.message);
  }
}

export async function insertKnowledgeVersion(version: Record<string, unknown>) {
  const sb = getSupabaseClient();
  const { error } = await sb.from('knowledge_versions').insert(version);

  if (error) throw new Error(`Failed to insert knowledge version: ${error.message}`);
}

export async function insertEntityRelation(relation: Record<string, unknown>) {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('entity_relations')
    .upsert(relation, {
      onConflict: 'org_id,source_entity_id,target_entity_id,relation_type',
    });

  if (error) throw new Error(`Failed to insert entity relation: ${error.message}`);
}
