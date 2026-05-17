import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';

/**
 * 홈 (explore) 상단 — 표지 텍스트 모두 제거 (2026-05-14).
 * status bar 영역 cream pad 만 유지 — 첫 콘텐츠와 노치 사이 호흡.
 */
export function DiscoverBrandBar() {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]} />;
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.cream },
});
