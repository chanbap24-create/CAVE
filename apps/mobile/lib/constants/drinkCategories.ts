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

// UI 노출 라벨 (한글). DB 값은 lowercase 영어 그대로 유지.
export const CATEGORY_LABELS: Record<string, string> = {
  wine:        '와인',
  spirit:      '양주',
  traditional: '전통주',
  other:       '기타',
};

// 한글 라벨 → DB enum 값 매핑. UI 코드가 한글 키로 접근.
export const CATEGORY_DB_MAP: Record<string, string> = {
  '와인':   'wine',
  '양주':   'spirit',
  '전통주': 'traditional',
  '기타':   'other',
};

// 카테고리 칩 — '전체' 는 필터 미적용을 의미하는 sentinel.
export const ALL_CATEGORIES_KEY = '전체';
export const CATEGORY_FILTERS = ['전체', '와인', '양주', '전통주', '기타'] as const;

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}
