import { v4 as uuid } from 'uuid';
import type { ExtractedEntity, Entity } from '@tribemem/shared';
import { chatHaiku, parseJsonResponse } from '../lib/anthropic';
import {
  findEntitiesByOrgId,
  insertEntity,
  getSupabaseClient,
} from '../lib/supabase';
import {
  RESOLVE_ENTITIES_SYSTEM_PROMPT,
  RESOLVE_ENTITIES_USER_PROMPT,
} from './prompts/resolve-entities';

interface ResolvedEntity {
  entityId: string;
  isNew: boolean;
}

interface EntityMatchResult {
  match: boolean;
  matched_entity_id: string | null;
  confidence: number;
  reasoning: string;
  suggested_alias: string | null;
}

// Cache existing entities for the duration of a batch to reduce DB calls
const entityCache = new Map<string, Entity[]>();

/**
 * Resolve an extracted entity against existing entities in the org.
 * Either matches to an existing entity or creates a new one.
 */
export async function resolveEntity(
  orgId: string,
  extracted: ExtractedEntity,
): Promise<ResolvedEntity> {
  // Get existing entities (cached per org)
  let existing = entityCache.get(orgId);
  if (!existing) {
    existing = (await findEntitiesByOrgId(orgId)) as Entity[];
    entityCache.set(orgId, existing);
  }

  // Quick exact name match (case-insensitive)
  const exactMatch = existing.find(
    (e) =>
      e.type === extracted.type &&
      (e.name.toLowerCase() === extracted.name.toLowerCase() ||
        e.aliases.some(
          (a) => a.toLowerCase() === extracted.name.toLowerCase(),
        )),
  );

  if (exactMatch) {
    // Update last_seen and mention_count
    await updateEntityStats(exactMatch.id);
    return { entityId: exactMatch.id, isNew: false };
  }

  // For entities with potential fuzzy matches, use Haiku
  const candidates = existing.filter((e) => e.type === extracted.type);

  if (candidates.length > 0) {
    const matchResult = await resolveWithAI(extracted, candidates);

    if (matchResult.match && matchResult.matched_entity_id) {
      // Add alias if suggested
      if (matchResult.suggested_alias) {
        await addAlias(
          matchResult.matched_entity_id,
          matchResult.suggested_alias,
        );
      }

      await updateEntityStats(matchResult.matched_entity_id);
      return { entityId: matchResult.matched_entity_id, isNew: false };
    }
  }

  // No match found: create new entity
  const entityId = await createNewEntity(orgId, extracted);

  // Update cache
  const newEntity: Entity = {
    id: entityId,
    org_id: orgId,
    name: extracted.name,
    type: extracted.type,
    description: extracted.role || null,
    aliases: [],
    metadata: {},
    first_seen_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    mention_count: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  existing.push(newEntity);
  entityCache.set(orgId, existing);

  return { entityId, isNew: true };
}

/**
 * Use Haiku to determine if the new entity matches any existing candidate.
 */
async function resolveWithAI(
  extracted: ExtractedEntity,
  candidates: Entity[],
): Promise<EntityMatchResult> {
  // Limit candidates to avoid overly long prompts
  const topCandidates = candidates.slice(0, 20);

  const existingList = topCandidates
    .map(
      (e) =>
        `- ID: ${e.id} | Name: "${e.name}" | Type: ${e.type} | Aliases: [${e.aliases.join(', ')}] | Description: ${e.description || 'N/A'}`,
    )
    .join('\n');

  const userPrompt = RESOLVE_ENTITIES_USER_PROMPT
    .replace('{{NEW_NAME}}', extracted.name)
    .replace('{{NEW_TYPE}}', extracted.type)
    .replace('{{NEW_ROLE}}', extracted.role || 'N/A')
    .replace('{{EXISTING_ENTITIES}}', existingList);

  try {
    const response = await chatHaiku(
      [{ role: 'user', content: userPrompt }],
      {
        system: RESOLVE_ENTITIES_SYSTEM_PROMPT,
        maxTokens: 512,
        temperature: 0,
      },
    );

    return parseJsonResponse<EntityMatchResult>(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[EntityResolver] AI resolution failed:', message);
    return {
      match: false,
      matched_entity_id: null,
      confidence: 0,
      reasoning: 'AI resolution failed, creating new entity',
      suggested_alias: null,
    };
  }
}

async function createNewEntity(
  orgId: string,
  extracted: ExtractedEntity,
): Promise<string> {
  const now = new Date().toISOString();
  return insertEntity({
    id: uuid(),
    org_id: orgId,
    name: extracted.name,
    type: extracted.type,
    description: extracted.role || null,
    aliases: [],
    metadata: {},
    first_seen_at: now,
    last_seen_at: now,
    mention_count: 1,
    created_at: now,
    updated_at: now,
  });
}

async function updateEntityStats(entityId: string): Promise<void> {
  const sb = getSupabaseClient();
  // Use raw SQL to atomically increment mention_count
  await sb
    .from('entities')
    .update({
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', entityId);

  // Increment mention count via RPC or manual update
  await sb.rpc('increment_entity_mentions', { p_entity_id: entityId }).then(
    () => {},
    () => {
      // Fallback: non-atomic increment is acceptable
    },
  );
}

async function addAlias(entityId: string, alias: string): Promise<void> {
  const sb = getSupabaseClient();
  const { data } = await sb
    .from('entities')
    .select('aliases')
    .eq('id', entityId)
    .single();

  if (data) {
    const aliases = (data.aliases as string[]) || [];
    if (!aliases.includes(alias)) {
      aliases.push(alias);
      await sb
        .from('entities')
        .update({ aliases, updated_at: new Date().toISOString() })
        .eq('id', entityId);
    }
  }
}

/**
 * Clear the entity cache. Should be called between extraction batches
 * for different organizations.
 */
export function clearEntityCache(): void {
  entityCache.clear();
}
