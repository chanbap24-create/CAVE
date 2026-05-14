import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { H1, Caption } from '@/components/Typography';
import { colors, spacing } from '@/constants/theme';

/**
 * 홈 (explore) 표지 — 매거진 톤 (2026-05-14 redesign A).
 * Eyebrow + 큰 sans bold 한글 + sub italic.
 */
export function DiscoverBrandBar() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
      <Caption tone="warmMuted" style={styles.eyebrow}>i CAVE · DISCOVER</Caption>
      <H1 tone="warm" style={styles.title}>오늘의 한 잔</H1>
      <Caption tone="warmMuted" style={styles.sub}>지금 사람들이 모여드는 자리</Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.cream,
  },
  eyebrow: { letterSpacing: 2, marginBottom: spacing.sm },
  title: { fontSize: 30, lineHeight: 36, letterSpacing: -0.6, marginBottom: spacing.xs },
  sub: { fontStyle: 'italic' },
});
