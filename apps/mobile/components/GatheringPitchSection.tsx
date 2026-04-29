import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  bullets: string[];
}

/**
 * 모임 상세의 "이런 분께 추천해요" — 트레바리식 인용구 스타일.
 * 좌측 자주색 막대 + 큰 글씨로 픽업 라인 강조.
 */
export function GatheringPitchSection({ bullets }: Props) {
  if (!bullets || bullets.length === 0) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>이런 분께 추천해요</Text>
      <View style={styles.quote}>
        {bullets.map((b, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.text}>{b}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 36, paddingHorizontal: 20 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', letterSpacing: -0.3, marginBottom: 14 },
  quote: {
    borderLeftWidth: 3, borderLeftColor: '#7b2d4e',
    paddingLeft: 14, paddingVertical: 4,
    gap: 10,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dot: { fontSize: 16, color: '#7b2d4e', fontWeight: '700', lineHeight: 22 },
  text: { flex: 1, fontSize: 15, color: '#222', lineHeight: 22, fontWeight: '500' },
});
