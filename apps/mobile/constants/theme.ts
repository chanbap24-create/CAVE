// i Cave Design Tokens — Editorial / Magazine 톤 (2026-05-14 redesign A).
//
// Direction: 트레바리식 큐레이션 + 와인 일기 정서.
// 기존의 단편적 톤 (인스타식 / 폴라로이드 / 매거진 hero / 평면 카드) 을
// 한 시각언어로 통합. cream/sepia 액센트 + serif italic 강조 + 의도적 여백.

export const colors = {
  // ─── Base (white-first, cream 액센트) ───
  background: '#ffffff',
  surface: '#fafafa',
  surfaceLight: '#f5f5f5',
  /** 종이 질감 — 큐레이션 / 일기 카드 배경 */
  cream: '#fcfaf6',
  /** 큐레이션 강조 카드 배경 */
  creamDeep: '#f7f0e2',
  border: '#efefef',
  borderStrong: '#e0dccf',

  // ─── Text ───
  text: '#222222',
  textSecondary: '#666666',
  textMuted: '#999999',
  textLight: '#bbbbbb',
  /** 따뜻한 본문 톤 — cream 배경 위 텍스트 */
  textWarm: '#3a2a1e',
  textWarmMuted: '#7a6a55',

  // ─── Accent — Wine ───
  primary: '#7b2d4e',
  primaryLight: '#f7f0f3',
  primaryDark: '#5a1e38',

  // ─── Accent — Sepia / Gold (큐레이션 톤) ───
  /** badge / 큰 숫자 / 인용 */
  sepia: '#5a4a3e',
  sepiaLight: '#a08a72',
  /** 우수 / 추천 강조 */
  gold: '#a07818',
  goldSoft: '#c9a84c',
  goldBg: '#f8f4e8',

  // ─── Status ───
  success: '#4caf7c',
  error: '#ed4956',
  warning: '#e8a838',
  like: '#ed4956',
} as const;

// 4 / 8 / 12 / 16 / 24 / 32 / 48 grid — 카드 안 / 섹션 사이 모두 이 단위만 사용.
export const spacing = {
  xs: 4,
  sm: 8,
  /** 카드 내부 기본 / 행 사이 */
  base: 12,
  /** 화면 좌우 패딩 / 카드 사이 */
  md: 16,
  /** 섹션 사이 */
  lg: 24,
  /** 큰 섹션 분리 */
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  /** 매우 작은 메타 (+caption +tab dot) */
  micro: 10,
  /** 캡션 / 메타 라인 */
  caption: 11,
  /** 보조 / 라벨 */
  label: 12,
  /** body 본문 */
  body: 14,
  /** body 강조 / 카드 제목 */
  bodyLg: 15,
  /** 섹션 제목 / 인라인 강조 */
  h3: 17,
  /** 섹션 제목 큰 */
  h2: 20,
  /** 페이지 제목 */
  h1: 24,
  /** 매거진 hero / 큰 숫자 */
  display: 28,
  /** 압도적 hero */
  displayLg: 34,
} as const;

export const lineHeight = {
  tight: 1.2,
  base: 1.4,
  /** body — 한글 가독성 */
  body: 1.5,
  loose: 1.7,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const fontFamily = {
  /** 한글/숫자 본문 — 시스템 (다음 단계에서 Pretendard 도입 검토) */
  body: undefined as string | undefined,
  /** 영문 액센트 — 매거진 hero, 큰 숫자, 인용 */
  serifItalic: 'PlayfairDisplay_700Bold_Italic',
} as const;

export const borderRadius = {
  /** chip / 작은 badge */
  xs: 4,
  sm: 6,
  /** 카드 표준 */
  md: 12,
  /** hero 카드 */
  lg: 16,
  /** sheet / 모달 */
  xl: 24,
  full: 9999,
} as const;

// ─── Shadows / Elevation ───
// 매거진 톤은 그림자 절제. 카드 사이 구분은 border 우선, shadow 는 hover 만.
export const shadow = {
  none: { shadowOpacity: 0 },
  /** 카드 hover / press */
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  /** sheet / floating */
  lifted: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
} as const;

// ─── Card variants — 5등급 시각언어 ───
// 새 카드 만들 때 반드시 이 중 하나에 속하게. 1회만 등장하는 unique 카드는 내부 검토 후 추가.
export const cardVariants = {
  /** L1 — 콘텐츠 그리드 (셀러 / 후기 / 와인 인덱스). 정사각형, no padding. */
  grid: { bg: colors.background, border: colors.border, radius: 0, padding: 0 },
  /** L2 — 행 카드 (모임 일정 / 알림 / 메뉴 행). horizontal padding only. */
  row: { bg: colors.background, border: colors.border, radius: borderRadius.md, padding: spacing.base },
  /** L3 — hero 카드 (모임 큐레이션, 픽업 / 매거진). cream 배경 + serif. */
  hero: { bg: colors.cream, border: colors.borderStrong, radius: borderRadius.lg, padding: spacing.md },
  /** L4 — 폴라로이드 (내 픽 / 일기). 사진 + 메모 + 회전 액센트. */
  polaroid: { bg: colors.background, border: colors.border, radius: spacing.xs, padding: spacing.sm },
  /** L5 — 모듈 박스 (stats / badges / settings 행 그룹). minimal border. */
  module: { bg: colors.background, border: colors.border, radius: borderRadius.md, padding: spacing.md },
} as const;
