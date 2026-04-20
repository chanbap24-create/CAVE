import React from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import {
  CATEGORY_BG_COLORS,
  CATEGORY_TAG_STYLES,
  CATEGORY_LABELS,
} from '@/lib/constants/drinkCategories';

const bgColors = CATEGORY_BG_COLORS;
const tagStyles = CATEGORY_TAG_STYLES;

interface Props {
  drinks: any[];
  limit: number;
  refreshing: boolean;
  onRefresh: () => void;
}

/**
 * Wine-search result list shown on the Discover tab when the user types a
 * query under the 'All' category. Category mode renders posts instead (see
 * usePostsByCategory), so this is specifically for drink-catalog browsing.
 */
export function WinesSearchResults({ drinks, limit, refreshing, onRefresh }: Props) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.count}>
        {drinks.length >= limit ? `Showing top ${limit}` : `${drinks.length} items`}
      </Text>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />}
        keyboardShouldPersistTaps="handled"
      >
        {drinks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No drinks match your filter</Text>
          </View>
        ) : (
          drinks.map(d => <WineRow key={d.id} d={d} />)
        )}
      </ScrollView>
    </View>
  );
}

function WineRow({ d }: { d: any }) {
  const tag = tagStyles[d.category] || tagStyles.other;
  const label = (CATEGORY_LABELS[d.category] ?? d.category.charAt(0).toUpperCase() + d.category.slice(1)) as string;
  return (
    <View style={styles.item}>
      <View style={[styles.thumb, { backgroundColor: bgColors[d.category] || '#f0f0f0' }]} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{d.name}</Text>
        {d.name_ko && <Text style={styles.nameKo}>{d.name_ko}</Text>}
        <Text style={styles.meta}>{[d.region, d.country].filter(Boolean).join(', ')}</Text>
        <View style={[styles.catTag, { backgroundColor: tag.bg }]}>
          <Text style={[styles.catText, { color: tag.color }]}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  count: { fontSize: 12, color: '#bbb', paddingHorizontal: 16, paddingVertical: 8 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, paddingHorizontal: 16, gap: 14,
    borderBottomWidth: 1, borderBottomColor: '#f8f8f8',
  },
  thumb: { width: 52, height: 52, borderRadius: 10 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: '#222' },
  nameKo: { fontSize: 11, color: '#aaa', marginTop: 1 },
  meta: { fontSize: 11, color: '#999', marginTop: 3 },
  catTag: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  catText: { fontSize: 10, fontWeight: '600' },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#bbb' },
});
