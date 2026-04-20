import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTrendingDrinks } from '@/lib/hooks/useTrendingDrinks';
import { useEffect } from 'react';

import { CATEGORY_BG_COLORS, CATEGORY_TAG_STYLES, getCategoryLabel } from '@/lib/constants/drinkCategories';

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
      <Text style={styles.sectionTitle}>Trending This Week</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
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
  card: { width: 110, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0' },
  cardTop: { height: 60, justifyContent: 'flex-end', padding: 6 },
  rank: { fontSize: 16, fontWeight: '800', color: 'rgba(0,0,0,0.12)' },
  cardBody: { padding: 8 },
  cardName: { fontSize: 11, fontWeight: '600', color: '#222', lineHeight: 14 },
  cardMeta: { fontSize: 9, color: '#999', marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  catTag: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  catText: { fontSize: 8, fontWeight: '600' },
  addCount: { fontSize: 9, color: '#bbb' },
});
