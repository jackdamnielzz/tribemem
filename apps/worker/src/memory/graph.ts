import type { RelationType } from '@tribemem/shared';
import { v4 as uuid } from 'uuid';
import { getSupabaseClient, insertEntityRelation } from '../lib/supabase';

export interface GraphEdge {
  source_entity_id: string;
  target_entity_id: string;
  relation_type: RelationType;
  confidence: number;
}

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  description: string | null;
}

export interface GraphTraversalResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Add a relation between two entities in the knowledge graph.
 */
export async function addRelation(
  orgId: string,
  sourceEntityId: string,
  targetEntityId: string,
  relationType: RelationType,
  confidence: number = 0.8,
): Promise<void> {
  await insertEntityRelation({
    id: uuid(),
    org_id: orgId,
    source_entity_id: sourceEntityId,
    target_entity_id: targetEntityId,
    relation_type: relationType,
    confidence,
    evidence_count: 1,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

/**
 * Query the knowledge graph for entities connected to a given entity.
 * Uses recursive CTEs as a fallback for graph traversal when Apache AGE
 * is not available.
 *
 * @param orgId - Organization scope
 * @param entityId - Starting entity
 * @param maxDepth - Maximum traversal depth (default: 2)
 */
export async function findConnectedEntities(
  orgId: string,
  entityId: string,
  maxDepth: number = 2,
): Promise<GraphTraversalResult> {
  const sb = getSupabaseClient();

  // Use a recursive CTE via Supabase RPC for graph traversal
  const { data, error } = await sb.rpc('traverse_entity_graph', {
    p_org_id: orgId,
    p_entity_id: entityId,
    p_max_depth: maxDepth,
  });

  if (error) {
    console.warn(
      '[Graph] RPC traverse_entity_graph failed, falling back to manual traversal:',
      error.message,
    );
    return manualTraversal(orgId, entityId, maxDepth);
  }

  if (!data) {
    return { nodes: [], edges: [] };
  }

  const result = data as {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };

  return result;
}

/**
 * Manual graph traversal using multiple queries when the RPC is not available.
 * Performs BFS up to maxDepth levels.
 */
async function manualTraversal(
  orgId: string,
  startEntityId: string,
  maxDepth: number,
): Promise<GraphTraversalResult> {
  const sb = getSupabaseClient();
  const visitedIds = new Set<string>([startEntityId]);
  const allEdges: GraphEdge[] = [];
  let frontier = [startEntityId];

  for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
    // Fetch all relations where any frontier entity is source or target
    const { data: relations, error } = await sb
      .from('entity_relations')
      .select('*')
      .eq('org_id', orgId)
      .or(
        `source_entity_id.in.(${frontier.join(',')}),target_entity_id.in.(${frontier.join(',')})`,
      );

    if (error || !relations) break;

    const nextFrontier: string[] = [];

    for (const rel of relations) {
      const edge: GraphEdge = {
        source_entity_id: rel.source_entity_id,
        target_entity_id: rel.target_entity_id,
        relation_type: rel.relation_type,
        confidence: rel.confidence,
      };

      allEdges.push(edge);

      // Add newly discovered entity IDs to the next frontier
      for (const id of [rel.source_entity_id, rel.target_entity_id]) {
        if (!visitedIds.has(id)) {
          visitedIds.add(id);
          nextFrontier.push(id);
        }
      }
    }

    frontier = nextFrontier;
  }

  // Fetch all discovered entity details
  const entityIds = Array.from(visitedIds);
  const { data: entities } = await sb
    .from('entities')
    .select('id, name, type, description')
    .in('id', entityIds);

  const nodes: GraphNode[] = (entities ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    type: e.type,
    description: e.description,
  }));

  return { nodes, edges: allEdges };
}

/**
 * Get all relations for a specific entity.
 */
export async function getEntityRelations(
  orgId: string,
  entityId: string,
): Promise<GraphEdge[]> {
  const sb = getSupabaseClient();

  const { data, error } = await sb
    .from('entity_relations')
    .select('*')
    .eq('org_id', orgId)
    .or(
      `source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`,
    );

  if (error) {
    console.error('[Graph] Failed to fetch entity relations:', error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    source_entity_id: r.source_entity_id,
    target_entity_id: r.target_entity_id,
    relation_type: r.relation_type,
    confidence: r.confidence,
  }));
}

/**
 * Find entities that are related to ALL of the given entity IDs.
 * Useful for finding entities at the intersection of multiple topics.
 */
export async function findCommonEntities(
  orgId: string,
  entityIds: string[],
): Promise<GraphNode[]> {
  if (entityIds.length === 0) return [];

  const sb = getSupabaseClient();

  // Find entities connected to all given entities
  const { data, error } = await sb.rpc('find_common_entities', {
    p_org_id: orgId,
    p_entity_ids: entityIds,
  });

  if (error) {
    console.warn('[Graph] find_common_entities RPC failed:', error.message);
    return [];
  }

  return (data ?? []) as GraphNode[];
}
