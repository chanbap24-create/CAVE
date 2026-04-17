// Centralized drink category constants
// Used across explore, cellar, PostCard, TrendingDrinks, AddToCaveSheet

export const CATEGORY_BG_COLORS: Record<string, string> = {
  wine: '#f0e8dd',
  whiskey: '#e8ddd0',
  sake: '#e0e8f0',
  cognac: '#ede5d8',
  other: '#e8e8e8',
};

export const CATEGORY_TAG_STYLES: Record<string, { bg: string; color: string }> = {
  wine: { bg: '#f7f0f3', color: '#7b2d4e' },
  whiskey: { bg: '#f5f0e8', color: '#8a6d3b' },
  sake: { bg: '#eef2f7', color: '#3b6d8a' },
  cognac: { bg: '#f5efe8', color: '#8a5a3b' },
  other: { bg: '#f0f0f0', color: '#666' },
};

export const CATEGORY_LABELS: Record<string, string> = {
  wine: 'Wine',
  whiskey: 'Whisky',
  sake: 'Sake',
  cognac: 'Cognac',
  other: 'Other',
};

export const CATEGORY_DB_MAP: Record<string, string> = {
  Wine: 'wine',
  Whisky: 'whiskey',
  Sake: 'sake',
  Cognac: 'cognac',
  Other: 'other',
};

export const CATEGORY_FILTERS = ['All', 'Wine', 'Whisky', 'Sake', 'Cognac', 'Other'];

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category.charAt(0).toUpperCase() + category.slice(1);
}
