import type { Case, StrikeZone } from './types';

/**
 * Calculate strike zones for regular and alternate panels
 * Strike zone = panel_size + state_strikes + defense_strikes
 */
export function calculateStrikeZone(caseData: Case): StrikeZone {
  const regularTotal = caseData.jurySize + caseData.stateStrikes + caseData.defenseStrikes;
  const alternateTotal = caseData.numAlternates + caseData.stateAltStrikes + caseData.defenseAltStrikes;

  return {
    regular: {
      total: regularTotal,
      start: 1,
      end: regularTotal,
    },
    alternate: {
      total: alternateTotal,
      start: regularTotal + 1,
      end: regularTotal + alternateTotal,
    },
  };
}

/**
 * Check if a juror number is within the strike zone
 */
export function isInStrikeZone(
  jurorNumber: number,
  strikeZone: StrikeZone,
  panelType: 'REGULAR' | 'ALTERNATE',
  panelIndex?: number
): boolean {
  if (panelType === 'REGULAR') {
    return jurorNumber >= strikeZone.regular.start && jurorNumber <= strikeZone.regular.end;
  } else {
    // For alternates, use the 1-based index within the alternate panel
    // (panelIndex) to check against the alternate zone size.
    // If panelIndex not provided, all alternates are assumed in-zone.
    const pos = panelIndex ?? 1;
    return pos >= 1 && pos <= strikeZone.alternate.total;
  }
}

/**
 * Get juror priority for scoring (prioritize strike zone jurors)
 */
export function getJurorPriority(jurorNumber: number, strikeZone: StrikeZone, panelType: 'REGULAR' | 'ALTERNATE'): number {
  if (isInStrikeZone(jurorNumber, strikeZone, panelType)) {
    return 1; // High priority
  }
  return 0; // Low priority (outside strike zone)
}
