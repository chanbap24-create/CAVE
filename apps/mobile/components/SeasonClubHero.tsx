import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Discover 최상단 히어로 — 시즌 클럽 placeholder.
 * v2 에서 실제 7주 코스 / 4회 모임 시즌 클럽 데이터로 교체.
 *
 * 트레바리식 큐레이션 위계의 최상위 슬롯. 아직 제품이 없으니 사용자에게
 * "곧 나옵니다" 시그널만 명확히 주는 것이 우선.
 *
 * docs/icave_concept_updates.md §4, §5 참조.
 */
export function SeasonClubHero() {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.tag}><Text style={styles.tagText}>COMING SOON</Text></View>
        <Text style={styles.title}>시즌 클럽</Text>
        <Text style={styles.subtitle}>
          7주 코스 · 4회 모임{'\n'}
          소믈리에가 이끄는 큐레이션
        </Text>
        <Text style={styles.body}>
          매주 다른 와인을 마시고, 노트를 남기고, 셀러에 자동으로 누적됩니다.{'\n'}
          준비가 끝나는 대로 1차 클럽을 공개해요.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  card: {
    backgroundColor: '#231115',
    borderRadius: 16,
    paddingVertical: 24, paddingHorizontal: 20,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
    marginBottom: 14,
  },
  tagText: { color: '#f0d8e0', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#e8c8d4', fontSize: 13, fontWeight: '500', lineHeight: 20, marginBottom: 16 },
  body: { color: '#bba1ac', fontSize: 12, lineHeight: 18 },
});
