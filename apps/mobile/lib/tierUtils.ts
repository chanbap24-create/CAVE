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
