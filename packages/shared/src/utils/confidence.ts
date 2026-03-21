import type { ConfidenceLevel } from '../types/knowledge';

/**
 * Confidence scoring utilities for knowledge units.
 *
 * Confidence scores are stored as numbers between 0 and 1 and represent
 * how reliable a piece of knowledge is based on extraction quality,
 * number of confirmations, and time since last confirmation.
 */

/** Mapping from qualitative confidence levels to numeric scores */
const CONFIDENCE_LEVEL_MAP: Record<ConfidenceLevel, number> = {
  high: 0.9,
  medium: 0.6,
  low: 0.3,
};

/** Maximum confidence score */
const MAX_CONFIDENCE = 1.0;

/** Minimum confidence score */
const MIN_CONFIDENCE = 0.05;

/** Base boost per confirmation (before diminishing returns) */
const CONFIRMATION_BOOST_BASE = 0.1;

/** Decay rate per day (fraction of score lost per day without confirmation) */
const DAILY_DECAY_RATE = 0.002;

/** Number of days after which decay starts */
const DECAY_GRACE_PERIOD_DAYS = 30;

/**
 * Returns the initial confidence score based on the extraction confidence level.
 *
 * @param level - The qualitative confidence level from AI extraction.
 * @returns A numeric confidence score between 0 and 1.
 */
export function getInitialScore(level: ConfidenceLevel): number {
  return CONFIDENCE_LEVEL_MAP[level];
}

/**
 * Converts a numeric confidence score to a qualitative confidence level.
 *
 * @param score - A numeric confidence score between 0 and 1.
 * @returns The corresponding qualitative confidence level.
 */
export function scoreToLevel(score: number): ConfidenceLevel {
  if (score >= 0.75) return 'high';
  if (score >= 0.45) return 'medium';
  return 'low';
}

/**
 * Calculates the confidence boost from a confirmation event.
 * Uses diminishing returns: each successive confirmation provides
 * a smaller boost.
 *
 * Formula: boost = base / sqrt(confirmationCount)
 *
 * @param currentScore - The current confidence score.
 * @param confirmationCount - The number of previous confirmations (before this one).
 * @returns The new confidence score after the boost.
 */
export function applyConfirmationBoost(
  currentScore: number,
  confirmationCount: number,
): number {
  // Diminishing returns: boost decreases with sqrt of confirmation count
  const effectiveCount = Math.max(1, confirmationCount);
  const boost = CONFIRMATION_BOOST_BASE / Math.sqrt(effectiveCount);
  const newScore = Math.min(MAX_CONFIDENCE, currentScore + boost);
  return Math.round(newScore * 1000) / 1000;
}

/**
 * Calculates confidence decay over time without confirmation.
 * No decay occurs within the grace period (first 30 days).
 * After the grace period, decay is linear per day.
 *
 * @param currentScore - The current confidence score.
 * @param daysSinceLastConfirmation - Days since the knowledge was last confirmed.
 * @returns The decayed confidence score.
 */
export function applyDecay(
  currentScore: number,
  daysSinceLastConfirmation: number,
): number {
  if (daysSinceLastConfirmation <= DECAY_GRACE_PERIOD_DAYS) {
    return currentScore;
  }

  const decayDays = daysSinceLastConfirmation - DECAY_GRACE_PERIOD_DAYS;
  const decayAmount = decayDays * DAILY_DECAY_RATE;
  const newScore = Math.max(MIN_CONFIDENCE, currentScore - decayAmount);
  return Math.round(newScore * 1000) / 1000;
}

/**
 * Calculates the full confidence score for a knowledge unit,
 * taking into account the initial extraction, confirmations, and time decay.
 *
 * @param params - Parameters for the confidence calculation.
 * @returns The computed confidence score.
 */
export function calculateConfidence(params: {
  extractionLevel: ConfidenceLevel;
  confirmationCount: number;
  daysSinceLastConfirmation: number;
}): number {
  const { extractionLevel, confirmationCount, daysSinceLastConfirmation } = params;

  // Start with the initial extraction score
  let score = getInitialScore(extractionLevel);

  // Apply confirmations with diminishing returns
  for (let i = 1; i <= confirmationCount; i++) {
    score = applyConfirmationBoost(score, i);
  }

  // Apply time-based decay
  score = applyDecay(score, daysSinceLastConfirmation);

  return score;
}

/**
 * Determines if a knowledge unit should be flagged as stale based on
 * its confidence score and last confirmation date.
 *
 * @param score - Current confidence score.
 * @param daysSinceLastConfirmation - Days since last confirmation.
 * @param threshold - Confidence threshold below which the unit is stale (default: 0.3).
 * @returns True if the knowledge unit should be flagged as stale.
 */
export function isStaleKnowledge(
  score: number,
  daysSinceLastConfirmation: number,
  threshold = 0.3,
): boolean {
  const decayedScore = applyDecay(score, daysSinceLastConfirmation);
  return decayedScore < threshold;
}
