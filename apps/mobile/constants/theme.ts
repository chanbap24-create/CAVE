// I Cave Design Tokens — CAVE Design System v2
// Drop-in replacement for previous theme.ts
// • Burgundy primary (wine 700) + Carrot accent (carrot 600) + Cellar dark (cellar 800)
// • Full gray ramp (g100–g1000) — Karrot SEED 골격
// • Semantic + spacing/radius/shadow tokens

export const colors = {
  // ─── Base (호환 유지) ─────────────────────────────
  background: '#ffffff',
  surface: '#fafafa',
  surfaceLight: '#f5f5f5',
  border: '#eeeff1',

  // ─── Text (호환 유지) ─────────────────────────────
  text: '#2a3038',
  textSecondary: '#555d6d',
  textMuted: '#868b94',
  textLight: '#b6bac1',

  // ─── Brand (wine — burgundy) ─────────────────────
  primary: '#7b2d4e',       // wine 700
  primaryLight: '#fbf3f6',  // wine 50
  primaryDark: '#5a1e38',   // wine 800
  wine50: '#fbf3f6',
  wine100: '#f3dce4',
  wine300: '#c97ea0',
  wine500: '#a14a72',
  wine700: '#7b2d4e',
  wine800: '#5a1e38',
  wine900: '#3d1525',

  // ─── Accent (carrot — Karrot orange) ─────────────
  carrot50: '#fff4ec',
  carrot100: '#ffe0c4',
  carrot300: '#ff9c52',
  carrot500: '#ff7d23',
  carrot600: '#ff6600',
  carrot700: '#d44e00',

  // ─── Cellar dark (deep neutral) ──────────────────
  cellar800: '#28181b',
  cellar900: '#1a0f11',

  // ─── Gray ramp (g100–g1000) ──────────────────────
  g100: '#f7f8f9',
  g200: '#f3f4f5',
  g300: '#eeeff1',
  g400: '#dcdee3',
  g500: '#b6bac1',
  g600: '#868b94',
  g700: '#555d6d',
  g800: '#3a4150',
  g900: '#2a3038',
  g1000: '#1a1c20',

  // ─── Gold (premium / 진정성 high tier) ───────────
  gold: '#c9a84c',
  goldLight: '#f8f4e8',

  // ─── Status ──────────────────────────────────────
  success: '#079171',
  successLight: '#edfaf6',
  error: '#ed4956',
  errorLight: '#fdecee',
  warning: '#e8a838',
  warningLight: '#fef6e6',
  info: '#2f7eed',
  infoLight: '#eaf2fd',

  // ─── Social ──────────────────────────────────────
  like: '#ed4956',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  title: 34,
} as const;

// CAVE 타입 스케일 (참고용 — 기존 fontSize 와 병행)
export const type = {
  t2: 12,  t3: 13,  t4: 14,  t5: 16,
  t6: 18,  t7: 20,  t8: 22,  t9: 24,  t10: 26,
} as const;

export const fontFamily = {
  sans: 'Pretendard',     // 본문 — Pretendard 9-weight
  serif: 'NotoSerifKR',   // 디스플레이 — Noto Serif KR 900 (히어로 헤드라인 전용)
} as const;

export const fontWeight = {
  thin: '100',
  extraLight: '200',
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extraBold: '800',
  black: '900',
} as const;

export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// Elevation (RN Platform shadow tokens — iOS shadow* + Android elevation)
export const elevation = {
  s1: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  s2: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  s3: {
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const;
