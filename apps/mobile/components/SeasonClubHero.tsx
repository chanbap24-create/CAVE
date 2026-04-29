import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * Discover 최상단 히어로 — 시즌 클럽 (현재 placeholder, v2 데이터로 교체 예정).
 *
 * 트레바리식 큐레이션 위계의 최상위 슬롯. 트레바리 메인 히어로처럼 큰 비주얼 +
 * 명확한 가치제안 + CTA 버튼 톤. 데이터 본격화 전이라 'COMING SOON' 상태도
 * 사용자가 기대하도록 구성.
 *
 * docs/icave_concept_updates.md §4, §5.
 */
export function SeasonClubHero() {
  return (
    <View style={styles.wrap}>
      <Pressable style={styles.card} onPress={() => {/* v2: 시즌 클럽 안내 페이지 */}}>
        <View style={styles.tagRow}>
          <View style={styles.tag}><Text style={styles.tagText}>COMING SOON</Text></View>
        </View>
        <Text style={styles.title}>시즌 클럽</Text>
        <Text style={styles.subtitle}>
          소믈리에가 7주간 함께 시음하는 큐레이션 코스
        </Text>

        <View style={styles.bullets}>
          <Bullet text="매주 다른 와인 4회" />
          <Bullet text="시즌 단위 선결제 · 비치헤드 멤버십" />
          <Bullet text="마신 와인이 셀러에 자동 누적" />
        </View>

        <View style={styles.ctaRow}>
          <Text style={styles.cta}>1차 클럽 사전 알림 받기 ›</Text>
        </View>
      </Pressable>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#e8c8d4" strokeWidth={2.5}>
        <Path d="M5 13l4 4L19 7" />
      </Svg>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  card: {
    backgroundColor: '#231115',
    borderRadius: 18,
    paddingVertical: 26, paddingHorizontal: 22,
  },
  tagRow: { flexDirection: 'row', marginBottom: 14 },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 4,
  },
  tagText: { color: '#f0d8e0', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { color: '#e8c8d4', fontSize: 14, fontWeight: '500', lineHeight: 20, marginBottom: 18 },
  bullets: { gap: 8, marginBottom: 18 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulletText: { color: '#bba1ac', fontSize: 13, lineHeight: 18 },
  ctaRow: {
    paddingTop: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  cta: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
