import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { DiscoverSectionHeader } from '@/components/DiscoverSectionHeader';
import {
  getDiscoverCardWidth, getSnapInterval, HORIZONTAL_PADDING, CARD_GAP,
} from '@/lib/utils/discoverCardWidth';
import { timeAgo } from '@/lib/utils/dateUtils';
import type { RecentDrink } from '@/lib/hooks/useRecentDrinks';

const CARD_WIDTH = getDiscoverCardWidth();
const SNAP = getSnapInterval();

interface Props {
  drinks: RecentDrink[];
}

/**
 * 셀러의 "최근 마신 와인" 섹션. tasting_note 가 작성된 컬렉션 desc.
 * 카드 탭 → 와인 상세에서 별점·노트 편집.
 */
export function RecentlyDrunkRow({ drinks }: Props) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <DiscoverSectionHeader title="최근 마신 와인" actionLabel={null} />
      {drinks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>아직 기록이 없어요</Text>
          <Text style={styles.emptySub}>
            아래 셀러 목록의 와인을 탭해 별점·노트를 작성하면{'\n'}여기에 자동으로 올라와요.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP} decelerationRate="fast"
          contentContainerStyle={styles.row}
        >
          {drinks.map(d => (
            <Pressable
              key={d.id} style={styles.card}
              onPress={() => router.push(`/wine/${d.id}` as any)}
            >
              <View style={styles.imgWrap}>
                {d.collection_photo_url || d.wine?.image_url ? (
                  <Image
                    source={d.collection_photo_url || d.wine?.image_url || ''}
                    style={styles.img}
                    contentFit="cover" cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={[styles.img, styles.imgPlaceholder]} />
                )}
                {d.rating ? (
                  <View style={styles.ratingBadge}>
                    <Text style={styles.starIcon}>★</Text>
                    <Text style={styles.ratingText}>{d.rating}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.body}>
                <Text style={styles.wineName} numberOfLines={2}>
                  {d.wine?.name || '와인'}
                  {d.wine?.vintage_year ? ` ${d.wine.vintage_year}` : ''}
                </Text>
                <Text style={styles.when}>{timeAgo(d.tasting_note_updated_at)}</Text>
                {d.tasting_note ? <Text style={styles.note} numberOfLines={2}>{d.tasting_note}</Text> : null}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 24 },
  row: { paddingLeft: HORIZONTAL_PADDING, paddingRight: HORIZONTAL_PADDING / 2 },
  card: {
    width: CARD_WIDTH, marginRight: CARD_GAP,
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#eee', overflow: 'hidden',
  },
  imgWrap: { position: 'relative', backgroundColor: '#f5f0f2' },
  img: { width: '100%', height: 140 },
  imgPlaceholder: { backgroundColor: '#f0eaec' },
  ratingBadge: {
    position: 'absolute', left: 8, top: 8,
    flexDirection: 'row', backgroundColor: 'rgba(35,17,21,0.85)',
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, gap: 1,
  },
  starIcon: { fontSize: 10, color: '#f5a623' },
  ratingText: { fontSize: 10, fontWeight: '700', color: '#fff', marginLeft: 2 },

  body: { padding: 12 },
  wineName: { fontSize: 13, fontWeight: '600', color: '#222', lineHeight: 18 },
  when: { fontSize: 11, color: '#999', marginTop: 4 },
  note: { fontSize: 11, color: '#666', marginTop: 6, lineHeight: 16 },

  empty: {
    marginHorizontal: 16, paddingVertical: 18, paddingHorizontal: 16,
    backgroundColor: '#fafafa', borderRadius: 10,
  },
  emptyTitle: { fontSize: 13, fontWeight: '600', color: '#444' },
  emptySub: { fontSize: 12, color: '#7b2d4e', marginTop: 4, lineHeight: 18 },
});
