// Vivino식 테이스팅 프로파일 사전.
//
// 3-axis 슬라이더: 1~5. null 이면 미입력.
// 향 칩: 다중 선택. key 만 DB 에 저장.

export type TasteAxisKey = 'body' | 'sweet' | 'acid';

export interface TasteAxis {
  key: TasteAxisKey;
  leftLabel: string;
  rightLabel: string;
}

export const TASTE_AXES: TasteAxis[] = [
  { key: 'body', leftLabel: 'Light', rightLabel: 'Bold' },
  { key: 'sweet', leftLabel: 'Dry', rightLabel: 'Sweet' },
  { key: 'acid', leftLabel: 'Soft', rightLabel: 'Acidic' },
];

export interface TasteChip {
  key: string;
  emoji: string;
  label: string;
  /** 칩 카드 배경 톤 (Vivino 스타일). */
  bg: string;
}

// 8개 — 와인 시음 어휘에서 자주 쓰이는 메이저 카테고리.
// 추가/축소는 자주 변할 수 있으니 enum 대신 문자열 key + JS 사전 구조 유지.
export const TASTE_CHIPS: TasteChip[] = [
  { key: 'red_fruit',   emoji: '🍓', label: '레드 프룻',   bg: '#c0413f' },
  { key: 'black_fruit', emoji: '🍒', label: '블랙 프룻',   bg: '#5a2a3a' },
  { key: 'stone_fruit', emoji: '🍑', label: '스톤 프룻',   bg: '#d99570' },
  { key: 'tree_fruit',  emoji: '🍐', label: '트리 프룻',   bg: '#7a8d4f' },
  { key: 'tropical',    emoji: '🍍', label: '트로피컬',     bg: '#d99526' },
  { key: 'floral',      emoji: '🌹', label: '플로럴',       bg: '#b85982' },
  { key: 'spice',       emoji: '🌶', label: '스파이스',     bg: '#8a3a2a' },
  { key: 'chocolate',   emoji: '🍫', label: '초콜릿',       bg: '#4a3022' },
  { key: 'earthy',      emoji: '🍄', label: '어시',         bg: '#9a8060' },
  { key: 'oak',         emoji: '🌰', label: '오크',         bg: '#6e4a2a' },
];

export interface TasteProfileValue {
  body: number | null;
  sweet: number | null;
  acid: number | null;
  tags: string[];
}

export const EMPTY_TASTE_PROFILE: TasteProfileValue = {
  body: null, sweet: null, acid: null, tags: [],
};

/** DB에서 받은 jsonb 를 안전하게 정규화. 형태가 깨졌으면 빈 값 반환. */
export function normalizeTasteProfile(raw: unknown): TasteProfileValue {
  if (!raw || typeof raw !== 'object') return EMPTY_TASTE_PROFILE;
  const r = raw as Record<string, unknown>;
  const num1to5 = (v: unknown) =>
    typeof v === 'number' && v >= 1 && v <= 5 ? Math.round(v) : null;
  return {
    body: num1to5(r.body),
    sweet: num1to5(r.sweet),
    acid: num1to5(r.acid),
    tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === 'string') : [],
  };
}

/** 비어있는지 (모두 null + tags 비어있음). */
export function isTasteProfileEmpty(p: TasteProfileValue): boolean {
  return p.body == null && p.sweet == null && p.acid == null && p.tags.length === 0;
}
