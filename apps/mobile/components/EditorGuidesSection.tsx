import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { DiscoverSectionHeader } from '@/components/DiscoverSectionHeader';
import {
  HORIZONTAL_PADDING, CARD_GAP, getDiscoverCardWidth,
} from '@/lib/utils/discoverCardWidth';

const CARD_WIDTH = getDiscoverCardWidth();

/**
 * v2 — 와인/주류 가이드 (i cave 에디터 큐레이션 매거진).
 * 지금은 placeholder 카드 3장. 실 콘텐츠는 가이드 CMS 도입 후 교체.
 *
 * 트레바리 책 큐레이션 코너 / 데일리샷 매거진 코너 톤. 글 콘텐츠를 큰 비주얼로
 * 어필. 사용자가 "이 앱은 그냥 모임 모음이 아니라 콘텐츠도 본다" 인지하게.
 */
const PLACEHOLDERS = [
  { tag: '소믈리에 칼럼', title: '부르고뉴, 처음 마실 때 알아두면 좋은 5가지' },
  { tag: '비교 시음', title: '50만원 와인과 5만원 와인, 무엇이 다른가' },
  { tag: '오프 더 비튼 패스', title: '아직 덜 알려진 한국 전통주 5선' },
];

export function EditorGuidesSection() {
  return (
    <View style={styles.wrap}>
      <DiscoverSectionHeader
        title="i cave 가이드"
        subtitle="에디터가 직접 큐레이션한 주류 이야기"
        actionLabel="곧 공개"
        onActionPress={() => {/* v2 */}}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {PLACEHOLDERS.map((p, i) => (
          <Pressable key={i} style={styles.card} disabled>
            <View style={styles.thumb}>
              <View style={styles.thumbInner} />
            </View>
            <Text style={styles.tag}>{p.tag}</Text>
            <Text style={styles.title} numberOfLines={2}>{p.title}</Text>
            <Text style={styles.coming}>준비 중</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 32 },
  row: { paddingLeft: HORIZONTAL_PADDING, paddingRight: HORIZONTAL_PADDING / 2, gap: 0 },
  // 다른 가로 카드(Partner / User Gatherings) 와 동일 폭/높이 — 시각 통일
  card: {
    width: CARD_WIDTH, marginRight: CARD_GAP,
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#eee',
    overflow: 'hidden',
  },
  thumb: {
    width: '100%', height: 110,
    backgroundColor: '#f5f0f2',
    alignItems: 'center', justifyContent: 'center',
  },
  thumbInner: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#e8d4dc',
  },
  tag: {
    fontSize: 10, fontWeight: '700', color: '#7b2d4e', letterSpacing: 0.5,
    paddingHorizontal: 12, paddingTop: 10, textTransform: 'uppercase',
  },
  title: {
    fontSize: 13, fontWeight: '600', color: '#222', lineHeight: 18,
    paddingHorizontal: 12, paddingTop: 4,
  },
  coming: {
    fontSize: 11, color: '#aaa', paddingHorizontal: 12, paddingTop: 6, paddingBottom: 12,
  },
});
