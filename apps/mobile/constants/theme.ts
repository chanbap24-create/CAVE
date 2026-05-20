// i Cave Design Tokens — Minimal / 무인양품 톤 (2026-05-17 redesign B).
//
// Direction: 흑백 위주, 얇은 stroke, hairline divider, 컬러는 액센트만.
// 사진 / 콘텐츠가 주인공. 매거진 sepia/warm 톤 제거 — 시스템적·차분.
//
// 토큰 이름은 redesign A 와 동일 유지 (cream / textWarm 등) — 코드 호환,
// 값만 minimal 로 재정의. 따라서 caller 변경 없이 전체 톤 전환.

export const colors = {
  // ─── Base — 웜 아이보리 ─────────────────────────────
  /** 페이지 배경 — 웜 아이보리 (white-ish + 따뜻함) */
  background: '#FFFBF5',
  /** 서피스 약간 더 따뜻한 톤 — 카드/섹션 배경 */
  surface: '#FFF6EC',
  /** 더 강한 서피스 — 입력창/구분된 영역 */
  surfaceLight: '#FFE5D9',
  /** 이전 cream — 피치 크림 (카드 / 표지 강조) */
  cream: '#FFE5D9',
  /** 이전 creamDeep — 더 강한 피치 (히어로 / 강조) */
  creamDeep: '#FFD4B8',
  border: '#F0E0D0',
  borderStrong: '#E8D0BB',

  // ─── Text — 와인 브라운 + 웜 그레이 단계 ───────────
  /** 본문 — 와인 브라운 (accent) */
  text: '#2D1B1B',
  textSecondary: '#5A4A3A',
  textMuted: '#A89080',
  textLight: '#C8B8A8',
  /** redesign 호환 alias — 같은 와인 브라운 */
  textWarm: '#2D1B1B',
  textWarmMuted: '#8A7868',

  // ─── Accent — 코랄 오렌지 (Primary) ─────────────────
  /** 액션 / 링크 / 강조 — 코랄 오렌지 */
  primary: '#FF6B4A',
  /** primary 옅은 톤 — 칩 배경 / hover 면 */
  primaryLight: '#FFE5D9',
  /** primary 진한 톤 — pressed / 강조 강 */
  primaryDark: '#E04E2E',

  // ─── Highlight — 옐로우 (뱃지 / Pin) ────────────────
  /** 뱃지 / 강조 라벨 */
  gold: '#FFC93C',
  goldSoft: '#FFD865',
  goldBg: '#FFF4D0',

  // ─── Sepia (호환 alias) — 와인 브라운 톤으로 매핑 ──
  sepia: '#5A4A3A',
  sepiaLight: '#A89080',

  // ─── Status ─────────────────────────────────────────
  success: '#4CAF7C',
  error: '#ED4956',
  warning: '#FFC93C',
  like: '#FF6B4A',
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
  /** chip / 작은 badge — pill 효과는 full 사용 */
  xs: 6,
  sm: 10,
  /** 카드 표준 — 코랄 톤 가이드: 16~20 */
  md: 16,
  /** hero 카드 / 큰 섹션 */
  lg: 20,
  /** CTA 버튼 / sheet / 모달 — pill 톤 */
  xl: 24,
  /** 완전 pill (뱃지 / 아바타 ring) */
  full: 9999,
} as const;

// ─── Shadows / Elevation ───
// 코랄 톤 가이드: 카드 / 이미지에 부드러운 그림자 (box-shadow 0 4px 16px rgba(0,0,0,0.06)).
// 따뜻한 배경 위에 살짝 떠 있는 느낌. border 와 병행 가능.
export const shadow = {
  none: { shadowOpacity: 0 },
  /** 카드 / 이미지 표준 — 코랄 톤 표준 */
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  /** CTA / 강조 카드 */
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 5,
  },
  /** sheet / 모달 / floating */
  lifted: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// ─── Card variants — 5등급 시각언어 ───
// 코랄 톤: 라운드 코너 진하게 (16~20), 부드러운 그림자, 피치 배경 활용.
export const cardVariants = {
  /** L1 — 콘텐츠 그리드. 정사각형, no padding (그리드 사이만 gap). */
  grid: { bg: colors.background, border: colors.border, radius: 0, padding: 0 },
  /** L2 — 행 카드 (모임 일정 / 알림 / 메뉴 행). */
  row: { bg: colors.background, border: colors.border, radius: borderRadius.md, padding: spacing.base },
  /** L3 — hero 카드 (모임 / 시즌 클럽). 피치 배경 + 강한 라운드. */
  hero: { bg: colors.cream, border: colors.borderStrong, radius: borderRadius.lg, padding: spacing.md },
  /** L4 — 폴라로이드 (내 픽 / 일기). 사진 + 메모. */
  polaroid: { bg: colors.background, border: colors.border, radius: spacing.xs, padding: spacing.sm },
  /** L5 — 모듈 박스 (stats / badges). */
  module: { bg: colors.background, border: colors.border, radius: borderRadius.md, padding: spacing.md },
} as const;

// ─── Button variants — CTA 톤 (24px radius, full color + white text) ───
export const buttonVariants = {
  /** Primary CTA — 코랄 풀컬러 + 흰 텍스트, pill */
  primary: {
    bg: colors.primary, fg: '#fff',
    radius: borderRadius.xl,           // 24
    paddingV: spacing.base, paddingH: spacing.lg,
    fontSize: 16, fontWeight: '700' as const,
  },
  /** Secondary — outlined 피치 톤 */
  secondary: {
    bg: colors.cream, fg: colors.text,
    radius: borderRadius.xl,
    paddingV: spacing.base, paddingH: spacing.lg,
    fontSize: 16, fontWeight: '600' as const,
  },
  /** Pill chip — 작은 badge (highlight gold 등 풀컬러) */
  chip: {
    bg: colors.gold, fg: colors.text,
    radius: borderRadius.full,
    paddingV: spacing.xs, paddingH: spacing.base,
    fontSize: 12, fontWeight: '700' as const,
  },
} as const;
