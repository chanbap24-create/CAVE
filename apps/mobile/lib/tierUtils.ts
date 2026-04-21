// Returns avatar ring color based on collection count
// Below Expert (50): no effect
// Expert/Connoisseur (50-299): Gold
// Master/Grand Master (300-999): Platinum Blue
// Legend (1000+): Obsidian Purple

export function getAvatarRingColor(collectionCount: number): string | null {
  if (collectionCount >= 1000) return '#7860a8';  // Obsidian
  if (collectionCount >= 300) return '#5b7fbf';   // Platinum
  if (collectionCount >= 50) return '#c9a84c';    // Gold
  return null; // No effect
}

export function getTopBadge(collectionCount: number): { name: string; bg: string; color: string } | null {
  if (collectionCount >= 1000) return { name: 'Legend', bg: '#f0ecf8', color: '#7860a8' };
  if (collectionCount >= 500) return { name: 'Grand Master', bg: '#eef0f8', color: '#5b7fbf' };
  if (collectionCount >= 300) return { name: 'Master', bg: '#eef0f8', color: '#5b7fbf' };
  if (collectionCount >= 100) return { name: 'Connoisseur', bg: '#faf0d0', color: '#a07818' };
  if (collectionCount >= 50) return { name: 'Expert', bg: '#faf0d0', color: '#a07818' };
  if (collectionCount >= 30) return { name: 'Enthusiast', bg: '#f0f0f5', color: '#808090' };
  if (collectionCount >= 10) return { name: 'Collector', bg: '#f7f0f3', color: '#7b2d4e' };
  return null;
}

// Ladder in ascending order; used to compute current/next-tier thresholds
// and progress. Keep in sync with getTopBadge.
const TIER_LADDER = [
  { min: 0,    name: 'Newcomer' },
  { min: 10,   name: 'Collector' },
  { min: 30,   name: 'Enthusiast' },
  { min: 50,   name: 'Expert' },
  { min: 100,  name: 'Connoisseur' },
  { min: 300,  name: 'Master' },
  { min: 500,  name: 'Grand Master' },
  { min: 1000, name: 'Legend' },
] as const;

export interface TierProgress {
  /** Current tier name ("Newcomer" when below the first threshold). */
  current: string;
  /** Next tier ahead, or null when at the top. */
  next: string | null;
  /** 0..100 progress within the current tier bracket. 100 when at Legend. */
  percent: number;
  /** Bottles remaining to the next tier, or null at top. */
  remaining: number | null;
}

/**
 * Compute current tier + progress bar fill + remaining count for a given
 * collection size. Used by the My Cave hero header.
 */
export function getTierProgress(count: number): TierProgress {
  // Walk the ladder to find the current bracket.
  let currentIdx = 0;
  for (let i = TIER_LADDER.length - 1; i >= 0; i--) {
    if (count >= TIER_LADDER[i].min) { currentIdx = i; break; }
  }
  const current = TIER_LADDER[currentIdx];
  const next = TIER_LADDER[currentIdx + 1] ?? null;

  if (!next) {
    return { current: current.name, next: null, percent: 100, remaining: null };
  }

  const span = next.min - current.min;
  const into = count - current.min;
  const percent = span > 0 ? Math.round((into / span) * 100) : 0;
  return {
    current: current.name,
    next: next.name,
    percent: Math.max(0, Math.min(100, percent)),
    remaining: Math.max(0, next.min - count),
  };
}
