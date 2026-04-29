import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import type { RecommendedGathering } from '@/lib/hooks/useRecommendedGatherings';

interface Props {
  recs: RecommendedGathering[];
}

/**
 * 셀러 기반 추천 모임 가로 스크롤. 매칭 이유 라벨을 카드 상단에 노출.
 * docs/icave_concept_updates.md §2 cellar 흡수 항목 #5.
 */
export function RecommendedGatheringsRow({ recs }: Props) {
  const router = useRouter();
  if (recs.length === 0) return null;
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>내 셀러 기반 추천 모임</Text>
        <Pressable onPress={() => router.push('/(tabs)/explore')} hitSlop={6}>
          <Text style={styles.more}>더보기</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {recs.map(g => <Card key={g.id} g={g} onPress={() => router.push(`/gathering/${g.id}` as any)} />)}
      </ScrollView>
    </View>
  );
}

function Card({ g, onPress }: { g: RecommendedGathering; onPress: () => void }) {
  const dateLabel = g.gathering_date ? formatDate(g.gathering_date) : null;
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imgWrap}>
        {g.image_url ? (
          <Image source={{ uri: g.image_url }} style={styles.img} />
        ) : (
          <View style={[styles.img, styles.imgPlaceholder]} />
        )}
        {g.match_reason ? (
          <View style={styles.reasonBadge}>
            <Text style={styles.reasonText} numberOfLines={1}>{g.match_reason}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{g.title}</Text>
      <Text style={styles.cardMeta} numberOfLines={1}>
        {dateLabel ?? '일정 미정'}{g.location ? ` · ${g.location}` : ''}
      </Text>
      {g.max_members != null ? (
        <Text style={styles.cardSeats}>
          {g.current_members ?? 0}/{g.max_members} 참여
        </Text>
      ) : null}
    </Pressable>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${['일', '월', '화', '수', '목', '금', '토'][d.getDay()]}`;
}

const styles = StyleSheet.create({
  wrap: { marginTop: 18 },
  titleRow: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 10,
  },
  title: { fontSize: 15, fontWeight: '700', color: '#222' },
  more: { fontSize: 12, color: '#7b2d4e', fontWeight: '600' },
  row: { paddingHorizontal: 16, gap: 12 },
  card: { width: 180, marginRight: 12 },
  imgWrap: { position: 'relative', borderRadius: 10, overflow: 'hidden', backgroundColor: '#f5f5f5' },
  img: { width: '100%', height: 110 },
  imgPlaceholder: { backgroundColor: '#efe4ea' },
  reasonBadge: {
    position: 'absolute', left: 8, top: 8,
    backgroundColor: 'rgba(123,45,78,0.92)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    maxWidth: 160,
  },
  reasonText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  cardTitle: { marginTop: 8, fontSize: 13, fontWeight: '600', color: '#222', lineHeight: 18 },
  cardMeta: { marginTop: 4, fontSize: 11, color: '#666' },
  cardSeats: { marginTop: 2, fontSize: 11, color: '#999' },
});
