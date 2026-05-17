// i Cave Design Tokens — Minimal / 무인양품 톤 (2026-05-17 redesign B).
//
// Direction: 흑백 위주, 얇은 stroke, hairline divider, 컬러는 액센트만.
// 사진 / 콘텐츠가 주인공. 매거진 sepia/warm 톤 제거 — 시스템적·차분.
//
// 토큰 이름은 redesign A 와 동일 유지 (cream / textWarm 등) — 코드 호환,
// 값만 minimal 로 재정의. 따라서 caller 변경 없이 전체 톤 전환.

export const colors = {
  // ─── Base (white-first, 옅은 회색 layer) ───
  background: '#ffffff',
  surface: '#fafafa',
  surfaceLight: '#f5f5f5',
  /** 이전 cream — 거의 흰색에 살짝 회색 차이만 (#fafafa 톤) */
  cream: '#fafafa',
  /** 이전 creamDeep — section 강조 배경, 옅은 회색 */
  creamDeep: '#f0f0f0',
  border: '#efefef',
  /** 이전 borderStrong — 옅은 회색 단일 */
  borderStrong: '#e5e5e5',

  // ─── Text — 단색 3단 회색 ───
  text: '#222222',
  textSecondary: '#666666',
  textMuted: '#999999',
  textLight: '#bbbbbb',
  /** 이전 textWarm — 표준 black 으로 통일 */
  textWarm: '#222222',
  /** 이전 textWarmMuted — 회색 */
  textWarmMuted: '#999999',

  // ─── Accent — Wine (절제, 액션/링크/강조에만) ───
  primary: '#7b2d4e',
  primaryLight: '#f7f0f3',
  primaryDark: '#5a1e38',

  // ─── Sepia/Gold (호환 위해 토큰 유지, minimal 톤은 거의 안 씀) ───
  sepia: '#5a5a5a',
  sepiaLight: '#a0a0a0',
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
  /** 한글/숫자 본문 — Pretendard (한국 모던 앱 표준) */
  body: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  extrabold: 'Pretendard-ExtraBold',
  /** 호환용 — 기존 serif italic 사용처는 Pretendard ExtraBold 로 대체 */
  serifItalic: 'Pretendard-ExtraBold',
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
