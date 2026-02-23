import type { Response, Question } from './types';

/**
 * Calculate overall score for a juror based on their responses
 * Uses per-question weight (question.weight field, default 1, range 1-5)
 * Higher weight = more influence on the overall score
 * Falls back to category-based weights if provided (legacy support)
 */
export function calculateOverallScore(
  responses: (Response & { question: Question })[],
  categoryWeights?: Record<string, number>
): number | null {
  if (!responses || responses.length === 0) {
    return null;
  }

  // Filter to only scaled responses
  const scaledResponses = responses.filter(r => r.scaledValue !== null && r.scaledValue !== undefined);

  if (scaledResponses.length === 0) {
    return null;
  }

  let totalWeight = 0;
  let weightedSum = 0;

  for (const response of scaledResponses) {
    // Per-question weight takes priority (stored on the question itself)
    // Falls back to category-based weight, then default of 1
    let weight = response.question.weight ?? 1;

    // If no per-question weight but category weights provided, use those
    if (weight === 1 && response.question.category && categoryWeights) {
      weight = categoryWeights[response.question.category] || 1;
    }

    weightedSum += (response.scaledValue || 0) * weight;
    totalWeight += weight;
  }

  // Return rounded average
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

/**
 * Get score color for UI display (1-5 scale)
 */
export function getScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'gray';

  if (score >= 4) return 'green'; // Favorable
  if (score >= 2.5) return 'yellow'; // Neutral
  return 'red'; // Unfavorable
}

/**
 * Get score label for UI display
 */
export function getScoreLabel(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'Not Scored';

  if (score >= 4) return 'Favorable';
  if (score >= 2.5) return 'Neutral';
  return 'Unfavorable';
}

/**
 * Calculate batch scores for multiple jurors
 */
export function calculateBatchScores(
  jurorResponses: Map<string, (Response & { question: Question })[]>,
  categoryWeights?: Record<string, number>
): Map<string, number | null> {
  const scores = new Map<string, number | null>();

  for (const [jurorId, responses] of jurorResponses) {
    scores.set(jurorId, calculateOverallScore(responses, categoryWeights));
  }

  return scores;
}
