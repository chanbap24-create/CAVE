/**
 * 모임 카드 디자인 템플릿 — 트레바리 패턴.
 * 호스트가 모임 개설 시 선택. 각 템플릿은 컬러·번호·모티프 카피 + 그룹(category)을 포함.
 *
 * 그룹은 picker 가시성을 위해 도입:
 *   - basic   : 무난한 무드, 처음 시작용 (1~6)
 *   - mood    : 와인 카테고리·페어링 무드 강조 (레드 / 화이트 / 스파클링 등)
 *   - season  : 시즌 한정·테마 (가을·겨울·연말)
 */

export type CardTemplateCategory = 'basic' | 'mood' | 'season';

/**
 * Hero 내부 요소 배치 variant.
 *  - signature : num 좌하 / motif 우하 / glass 우상 / title 좌상단 strip
 *  - magazine  : num 좌상 / motif 우하 / glass 좌하 / title 우중단 큰 화이트
 *  - cover     : num 배경 워터마크 / motif 좌하 / glass 우상 / title 중앙 가장 큼
 */
export type CardLayoutVariant = 'signature' | 'magazine' | 'cover';

export interface CardTemplate {
  /** DB 저장 키 */
  key: string;
  /** 한국어 이름 (picker 표시) */
  name: string;
  /** 어떤 무드/시즌인지 분류 — picker 헤더로 사용 */
  category: CardTemplateCategory;
  /** hero 내부 배치 variant */
  layout: CardLayoutVariant;
  /** 카드 hero 영역 배경 */
  bg: string;
  /** 텍스트/숫자 포어그라운드 (대비) */
  fg: string;
  /** 모티프 카피 (2줄, 숫자 옆 인용구처럼 노출) */
  motif: [string, string];
  /** picker 썸네일에 박힌 큰 숫자. 실제 카드는 행 위치(slot)로 override */
  numberLabel: string;
  /** 와인 글라스 컬러 (모티프 옆 SVG 색) */
  glassColor: string;
}

// 코랄 팔레트 5 톤 — 모든 카드가 이 안에서 변주.
//   coral   #FF6B4A (primary)
//   peach   #FFE5D9 (secondary)
//   ivory   #FFFBF5 (background)
//   brown   #2D1B1B (accent)
//   gold    #FFC93C (highlight)
export const CARD_TEMPLATES: CardTemplate[] = [
  // ─────────── basic ───────────
  {
    key: 'classic_navy',                // key 호환 위해 유지 (DB 데이터)
    name: '코랄 시그니처',
    category: 'basic',
    layout: 'signature',
    bg: '#FF6B4A', fg: '#FFFBF5',
    motif: ['함께 마시는', '와인과 시간'],
    numberLabel: '1', glassColor: '#FFFBF5',
  },
  {
    key: 'warm_salmon',
    name: '피치 매거진',
    category: 'basic',
    layout: 'magazine',
    bg: '#FFE5D9', fg: '#2D1B1B',
    motif: ['삶의', '한 모금'],
    numberLabel: '2', glassColor: '#FF6B4A',
  },
  {
    key: 'lavender_dawn',
    name: '아이보리 커버',
    category: 'basic',
    layout: 'cover',
    bg: '#FFFBF5', fg: '#2D1B1B',
    motif: ['내 마음의', '한 잔'],
    numberLabel: '3', glassColor: '#FF6B4A',
  },
  {
    key: 'forest_sage',
    name: '와인 브라운',
    category: 'basic',
    layout: 'signature',
    bg: '#2D1B1B', fg: '#FFC93C',
    motif: ['자연과', '와인'],
    numberLabel: '4', glassColor: '#FFC93C',
  },
  {
    key: 'sunset_mustard',
    name: '옐로우 머스타드',
    category: 'basic',
    layout: 'magazine',
    bg: '#FFC93C', fg: '#2D1B1B',
    motif: ['황혼의', '시음'],
    numberLabel: '5', glassColor: '#FF6B4A',
  },
  {
    key: 'cool_sky',
    name: '딥 피치',
    category: 'basic',
    layout: 'cover',
    bg: '#FFD4B8', fg: '#2D1B1B',
    motif: ['맑은', '바람결 와인'],
    numberLabel: '6', glassColor: '#FF6B4A',
  },

  // ─────────── mood — 와인 카테고리/주제 ───────────
  {
    key: 'deep_burgundy',
    name: '딥 코랄',
    category: 'mood',
    layout: 'signature',
    bg: '#E04E2E', fg: '#FFFBF5',
    motif: ['묵직한', '레드의 밤'],
    numberLabel: '7', glassColor: '#FFC93C',
  },
  {
    key: 'crisp_white',
    name: '크림 화이트',
    category: 'mood',
    layout: 'magazine',
    bg: '#FFF6EC', fg: '#2D1B1B',
    motif: ['청량한', '화이트 한 잔'],
    numberLabel: '8', glassColor: '#FF6B4A',
  },
  {
    key: 'sparkling_rose',
    name: '스파클링 피치',
    category: 'mood',
    layout: 'cover',
    bg: '#FFE5D9', fg: '#E04E2E',
    motif: ['톡 쏘는', '버블의 시간'],
    numberLabel: '9', glassColor: '#E04E2E',
  },

  // ─────────── season — 시즌 한정 ───────────
  {
    key: 'autumn_cognac',
    name: '오텀 코랄',
    category: 'season',
    layout: 'signature',
    bg: '#FF6B4A', fg: '#FFC93C',
    motif: ['가을밤', '한 모금'],
    numberLabel: '10', glassColor: '#FFC93C',
  },
  {
    key: 'winter_evergreen',
    name: '윈터 브라운',
    category: 'season',
    layout: 'magazine',
    bg: '#2D1B1B', fg: '#FFE5D9',
    motif: ['겨울의', '따뜻한 잔'],
    numberLabel: '11', glassColor: '#FF6B4A',
  },
  {
    key: 'midnight_velvet',
    name: '미드나잇 골드',
    category: 'season',
    layout: 'cover',
    bg: '#2D1B1B', fg: '#FFC93C',
    motif: ['연말의', '깊은 와인'],
    numberLabel: '12', glassColor: '#FFC93C',
  },
];

/** picker UI 에서 노출할 카테고리 라벨 */
export const CARD_TEMPLATE_CATEGORY_LABELS: Record<CardTemplateCategory, string> = {
  basic: '기본',
  mood: '무드',
  season: '시즌',
};

/** 모든 템플릿 키 — DB CHECK 제약과 동기화 */
export const CARD_TEMPLATE_KEYS = CARD_TEMPLATES.map(t => t.key);

export const DEFAULT_CARD_TEMPLATE = CARD_TEMPLATES[0].key;

export function getCardTemplate(key: string | null | undefined): CardTemplate {
  if (!key) return CARD_TEMPLATES[0];
  return CARD_TEMPLATES.find(t => t.key === key) || CARD_TEMPLATES[0];
}
