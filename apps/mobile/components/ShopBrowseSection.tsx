import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DiscoverSectionHeader } from '@/components/DiscoverSectionHeader';

/**
 * v2 — 샵 둘러보기 (제휴 와인샵 카탈로그). venues 테이블 + 스마트오더 통합 후
 * 활성. 지금은 placeholder 카드 한 장으로 슬롯만 점유 — 사용자가 "여기서
 * 샵까지 연결될 거구나" 인지.
 *
 * docs/icave_concept_updates.md §7 양면 플랫폼.
 */
export function ShopBrowseSection() {
  return (
    <View style={styles.wrap}>
      <DiscoverSectionHeader
        title="샵 둘러보기"
        subtitle="단골 와인샵을 찾고, 모임 후 바로 구매까지"
        actionLabel="곧 공개"
        onActionPress={() => {/* v2 */}}
      />
      <View style={styles.card}>
        <Text style={styles.icon}>🍷</Text>
        <Text style={styles.title}>제휴 샵 합류 모집 중</Text>
        <Text style={styles.body}>
          영수증 인증·시즌 클럽 호스팅·정산까지 한 번에.{'\n'}
          가맹 문의는 i cave 팀에 연락 주세요.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 32 },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#faf6f8', borderRadius: 14,
    paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center',
    borderWidth: 1, borderColor: '#f0e4ea',
  },
  icon: { fontSize: 28, marginBottom: 10 },
  title: { fontSize: 14, fontWeight: '700', color: '#7b2d4e', marginBottom: 6 },
  body: { fontSize: 12, color: '#9c5b73', lineHeight: 18, textAlign: 'center' },
});
