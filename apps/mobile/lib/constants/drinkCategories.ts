// Centralized drink category constants.
// Kept in sync with drink_categories DB seed (migration 00025). Four keys:
//   wine, spirit, traditional, other
// Anything that previously used whiskey/cognac/sake/beer has been migrated.

export const CATEGORY_BG_COLORS: Record<string, string> = {
  wine:        '#f0e8dd',
  spirit:      '#e8ddd0',
  traditional: '#e0e8f0',
  other:       '#e8e8e8',
};

export const CATEGORY_TAG_STYLES: Record<string, { bg: string; color: string }> = {
  wine:        { bg: '#f7f0f3', color: '#7b2d4e' },
  spirit:      { bg: '#f5f0e8', color: '#8a6d3b' },
  traditional: { bg: '#eef2f7', color: '#3b6d8a' },
  other:       { bg: '#f0f0f0', color: '#666' },
};

export const CATEGORY_LABELS: Record<string, string> = {
  wine:        'Wine',
  spirit:      'Spirit',
  traditional: 'Traditional',
  other:       'Other',
};

export const CATEGORY_DB_MAP: Record<string, string> = {
  Wine:        'wine',
  Spirit:      'spirit',
  Traditional: 'traditional',
  Other:       'other',
};

export const CATEGORY_FILTERS = ['All', 'Wine', 'Spirit', 'Traditional', 'Other'] as const;

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category.charAt(0).toUpperCase() + category.slice(1);
}
