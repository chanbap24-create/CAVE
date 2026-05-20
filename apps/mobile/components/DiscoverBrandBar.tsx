import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeroBanner } from '@/components/HeroBanner';
import { colors, spacing } from '@/constants/theme';

/**
 * 홈 (explore) 상단 — 코랄 풀폭 hero banner.
 * 파파이스/배민식 첫인상 톤.
 */
export function DiscoverBrandBar() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.xs }]}>
      <HeroBanner
        title={'오늘은\n뭐 마실까?'}
        subtitle="i CAVE · DISCOVER"
        tone="coral"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.background },
});
