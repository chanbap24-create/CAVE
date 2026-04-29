import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTrendingDrinks } from '@/lib/hooks/useTrendingDrinks';
import { useEffect } from 'react';

import { CATEGORY_BG_COLORS, CATEGORY_TAG_STYLES, getCategoryLabel } from '@/lib/constants/drinkCategories';
import {
  getDiscoverCardWidth, getSnapInterval, HORIZONTAL_PADDING, CARD_GAP,
} from '@/lib/utils/discoverCardWidth';

const CARD_WIDTH = getDiscoverCardWidth();
const SNAP = getSnapInterval();

const bgColors = CATEGORY_BG_COLORS;
const tagStyles = CATEGORY_TAG_STYLES;

interface Props {
  refreshKey?: number;
  category?: string | null;
}

export function TrendingDrinks({ refreshKey = 0, category }: Props) {
  const { drinks, loadTrending } = useTrendingDrinks(category);

  useEffect(() => { loadTrending(); }, [refreshKey, loadTrending]);

  if (drinks.length === 0) return null;

  return (
    <View>
      {/* 헤더는 explore.tsx 의 DiscoverSectionHeader 가 담당 — 중복 방지 */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP} decelerationRate="fast"
        contentContainerStyle={{ paddingLeft: HORIZONTAL_PADDING, paddingRight: HORIZONTAL_PADDING / 2 }}
      >
        {drinks.map((d, i) => {
          const tag = tagStyles[d.category] || tagStyles.other;
          return (
            <View key={d.wine_id} style={styles.card}>
              <View style={[styles.cardTop, { backgroundColor: bgColors[d.category] || '#f0f0f0' }]}>
                <Text style={styles.rank}>#{i + 1}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={2}>{d.name}</Text>
                <Text style={styles.cardMeta}>{d.country || ''}</Text>
                <View style={styles.cardBottom}>
                  <View style={[styles.catTag, { backgroundColor: tag.bg }]}>
                    <Text style={[styles.catText, { color: tag.color }]}>{getCategoryLabel(d.category)}</Text>
                  </View>
                  <Text style={styles.addCount}>{d.add_count} added</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#222', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  // 다른 가로 카드(Partner / User / Caves) 와 동일 폭/이미지 110pt
  card: { width: CARD_WIDTH, marginRight: CARD_GAP, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  cardTop: { height: 110, justifyContent: 'flex-end', padding: 12 },
  rank: { fontSize: 28, fontWeight: '800', color: 'rgba(0,0,0,0.15)' },
  cardBody: { padding: 12 },
  cardName: { fontSize: 13, fontWeight: '600', color: '#222', lineHeight: 18 },
  cardMeta: { fontSize: 11, color: '#888', marginTop: 4 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  catTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  catText: { fontSize: 10, fontWeight: '600' },
  addCount: { fontSize: 10, color: '#bbb' },
});
