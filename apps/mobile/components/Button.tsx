import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, type ViewStyle, type StyleProp } from 'react-native';
import { colors, spacing, borderRadius, fontFamily, shadow } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'pill';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  variant?: Variant;
  size?: Size;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * 코랄 톤 CTA — 24px radius + 풀컬러 + 흰 텍스트.
 *
 *   primary   : 코랄 풀컬러, 메인 액션 (구매하기 / 등록 / 신청)
 *   secondary : 피치 outlined, 보조 액션 (편집 / 공유)
 *   ghost     : transparent + 텍스트만 (취소 / 더보기)
 *   pill      : 옐로우 highlight, 작은 알약 chip
 */
export function Button({
  label, variant = 'primary', size = 'md', onPress, loading, disabled, fullWidth, style,
}: Props) {
  const v = variantStyle[variant];
  const s = sizeStyle[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        v.container,
        s.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.spinnerColor} />
      ) : (
        <Text style={[styles.label, v.label, s.label]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
  label: { fontFamily: fontFamily.bold, letterSpacing: -0.2 },
});

const variantStyle = {
  primary: {
    container: { backgroundColor: colors.primary, borderRadius: borderRadius.xl, ...shadow.soft },
    label: { color: '#fff' },
    spinnerColor: '#fff',
  },
  secondary: {
    container: {
      backgroundColor: colors.cream,
      borderRadius: borderRadius.xl,
      borderWidth: 1, borderColor: colors.borderStrong,
    },
    label: { color: colors.text },
    spinnerColor: colors.text,
  },
  ghost: {
    container: { backgroundColor: 'transparent', borderRadius: borderRadius.xl },
    label: { color: colors.primary },
    spinnerColor: colors.primary,
  },
  // pill — 옐로우 풀폭 CTA (파파이스 "사용하기" 톤). 노란 fill + 검정 텍스트.
  pill: {
    container: { backgroundColor: colors.gold, borderRadius: borderRadius.xl, ...shadow.soft },
    label: { color: colors.text, fontFamily: fontFamily.bold },
    spinnerColor: colors.text,
  },
} as const;

const sizeStyle = {
  sm: {
    container: { paddingVertical: spacing.xs, paddingHorizontal: spacing.base, minHeight: 32 },
    label: { fontSize: 13 },
  },
  md: {
    container: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg, minHeight: 44 },
    label: { fontSize: 15 },
  },
  lg: {
    container: { paddingVertical: spacing.base, paddingHorizontal: spacing.lg, minHeight: 52 },
    label: { fontSize: 16 },
  },
} as const;
