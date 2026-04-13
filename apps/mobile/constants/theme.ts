// I Cave Design Tokens
// Light theme - clean & minimal

export const colors = {
  // Base
  background: '#ffffff',
  surface: '#fafafa',
  surfaceLight: '#f5f5f5',
  border: '#efefef',

  // Text
  text: '#222222',
  textSecondary: '#666666',
  textMuted: '#999999',
  textLight: '#bbbbbb',

  // Accent
  primary: '#7b2d4e',
  primaryLight: '#f7f0f3',
  primaryDark: '#5a1e38',

  // Secondary - Gold (badges, premium)
  gold: '#c9a84c',
  goldLight: '#f8f4e8',

  // Status
  success: '#4caf7c',
  error: '#ed4956',
  warning: '#e8a838',

  // Social
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

export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
