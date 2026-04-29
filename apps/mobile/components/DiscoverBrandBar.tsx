import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Discover 탭 상단 슬림 브랜드 바 — 좌측 상단 "Cave" 로고만 노출.
 *
 * 카메라 노치/다이내믹 아일랜드와 캐러셀이 겹치지 않도록 safe-area top inset
 * 만큼 상단 패딩 확보. 별도 boder/bg 없이 ScrollView 의 첫 화면 일부로 자연스럽게.
 */
export function DiscoverBrandBar() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 6 }]}>
      <Text style={styles.logo}>Cave</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 20,
    paddingBottom: 6,
    backgroundColor: '#fff',
  },
  logo: {
    fontSize: 22,
    color: '#7b2d4e',
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    letterSpacing: -0.5,
  },
});
