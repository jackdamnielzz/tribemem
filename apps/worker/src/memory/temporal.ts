import { v4 as uuid } from 'uuid';
import type { ChangeType } from '@tribemem/shared';
import {
  getSupabaseClient,
  insertKnowledgeVersion,
  updateKnowledgeUnit,
} from '../lib/supabase';

/**
 * Confidence decay rate per day.
 * Knowledge confidence decreases over time if not re-confirmed.
 */
const DECAY_RATE_PER_DAY = 0.001;

/**
 * Minimum confidence score before knowledge is flagged as stale.
 */
const STALE_THRESHOLD = 0.3;

/**
 * Create a new version of a knowledge unit when its content changes.
 * Stores the previous content for audit trail.
 */
export async function createVersion(
  knowledgeUnitId: string,
  changeType: ChangeType,
  previousContent: string | null,
  newContent: string | null,
  changeReason: string | null,
  changedBy: string,
): Promise<void> {
  const sb = getSupabaseClient();

  // Get the current version number
  const { data: versions } = await sb
    .from('knowledge_versions')
    .select('version_number')
    .eq('knowledge_unit_id', knowledgeUnitId)
    .order('version_number', { ascending: false })
    .limit(1);

  const nextVersion =
    versions && versions.length > 0
      ? (versions[0]!.version_number as number) + 1
      : 1;

  await insertKnowledgeVersion({
    id: uuid(),
    knowledge_unit_id: knowledgeUnitId,
    version_number: nextVersion,
    change_type: changeType,
    previous_content: previousContent,
    new_content: newContent,
    change_reason: changeReason,
    changed_by: changedBy,
    created_at: new Date().toISOString(),
  });
}

/**
 * Supersede an old knowledge unit with a new one.
 * Marks the old unit as superseded and links the two.
 */
export async function supersedeKnowledge(
  oldKnowledgeId: string,
  newKnowledgeId: string,
  reason: string,
): Promise<void> {
  // Mark the old knowledge as superseded
  await updateKnowledgeUnit(oldKnowledgeId, {
    status: 'superseded',
    is_current: false,
    superseded_by: newKnowledgeId,
    valid_until: new Date().toISOString(),
  });

  // Link the new knowledge as superseding the old
  await updateKnowledgeUnit(newKnowledgeId, {
    supersedes: oldKnowledgeId,
  });

  // Create version records for both
  await createVersion(
    oldKnowledgeId,
    'superseded',
    null,
    null,
    `Superseded by ${newKnowledgeId}: ${reason}`,
    'system',
  );
}

/**
 * Calculate the decayed confidence score for a knowledge unit
 * based on how long ago it was last confirmed.
 *
 * @param originalConfidence - The original confidence score (0-1)
 * @param lastConfirmedAt - ISO timestamp of last confirmation
 * @returns The decayed confidence score
 */
export function calculateConfidenceDecay(
  originalConfidence: number,
  lastConfirmedAt: string | null,
): number {
  if (!lastConfirmedAt) return originalConfidence;

  const lastConfirmed = new Date(lastConfirmedAt).getTime();
  const now = Date.now();
  const daysSinceConfirmed = (now - lastConfirmed) / (1000 * 60 * 60 * 24);

  // Exponential decay
  const decayedConfidence =
    originalConfidence * Math.exp(-DECAY_RATE_PER_DAY * daysSinceConfirmed);

  return Math.max(0, Math.min(1, decayedConfidence));
}

/**
 * Check if a knowledge unit is stale based on confidence decay.
 */
export function isStale(
  originalConfidence: number,
  lastConfirmedAt: string | null,
): boolean {
  const decayed = calculateConfidenceDecay(
    originalConfidence,
    lastConfirmedAt,
  );
  return decayed < STALE_THRESHOLD;
}

/**
 * Batch update confidence scores for all knowledge units in an org
 * based on temporal decay. Returns IDs of newly stale units.
 */
export async function applyConfidenceDecay(
  orgId: string,
): Promise<string[]> {
  const sb = getSupabaseClient();

  // Fetch all active knowledge units
  const { data: units, error } = await sb
    .from('knowledge_units')
    .select('id, confidence_score, last_confirmed_at')
    .eq('org_id', orgId)
    .eq('status', 'active');

  if (error || !units) {
    console.error('[Temporal] Failed to fetch knowledge units:', error?.message);
    return [];
  }

  const newlyStale: string[] = [];

  for (const unit of units) {
    const decayed = calculateConfidenceDecay(
      unit.confidence_score,
      unit.last_confirmed_at,
    );

    // Only update if the decayed score is meaningfully different
    if (Math.abs(decayed - unit.confidence_score) > 0.01) {
      await updateKnowledgeUnit(unit.id, {
        confidence_score: Math.round(decayed * 1000) / 1000,
      });

      if (decayed < STALE_THRESHOLD && unit.confidence_score >= STALE_THRESHOLD) {
        newlyStale.push(unit.id);
      }
    }
  }

  return newlyStale;
}
