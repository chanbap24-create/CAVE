import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  agreement: string | null;
}

/**
 * 모임 상세의 "이 모임의 약속" — 참여 규칙 / 매너 / 준비물.
 * 다크 카드로 시즌 클럽 hero 와 톤 맞춤. 트러스트 신호 + 룰 명시.
 */
export function GatheringAgreementSection({ agreement }: Props) {
  if (!agreement || !agreement.trim()) return null;
  // 줄바꿈 보존 (호스트가 라인 단위로 적었을 가능성)
  const lines = agreement.split('\n').map(l => l.trim()).filter(Boolean);
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.label}>이 모임의 약속</Text>
        {lines.map((line, i) => (
          <Text key={i} style={styles.line}>{line}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 36, paddingHorizontal: 20 },
  card: {
    backgroundColor: '#231115', borderRadius: 14,
    paddingVertical: 22, paddingHorizontal: 22,
  },
  label: {
    fontSize: 11, fontWeight: '800', color: '#f0d8e0', letterSpacing: 1.5,
    textTransform: 'uppercase', marginBottom: 14,
  },
  line: {
    fontSize: 14, color: '#fff', lineHeight: 22, marginBottom: 6,
  },
});
