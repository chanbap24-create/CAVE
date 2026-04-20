import React from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { CATEGORY_LABELS } from '@/lib/constants/drinkCategories';

const labelMap = CATEGORY_LABELS;
const typeColors: Record<string, string> = {
  wine:        '#7b2d4e',
  spirit:      '#8a6d3b',
  traditional: '#3b6d8a',
  other:       '#999',
};

interface Props {
  collections: any[];
  refreshing: boolean;
  onRefresh: () => void;
  onLongPressRow: (collectionId: number, hasPhoto: boolean) => void;
}

export function CellarList({ collections, refreshing, onRefresh, onLongPressRow }: Props) {
  if (collections.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Cave is empty</Text>
        <Text style={styles.emptyDesc}>Tap "+ Add" to start{'\n'}your collection</Text>
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />}
    >
      {collections.map(c => {
        const w = c.wine;
        if (!w) return null;
        const typeColor = typeColors[w.category] || '#999';
        return (
          <Pressable
            key={c.id}
            style={styles.listItem}
            onLongPress={() => onLongPressRow(c.id, !!c.photo_url)}
          >
            <View style={[styles.listDot, { backgroundColor: typeColor }]} />
            <View style={styles.listInfo}>
              <Text style={styles.listName} numberOfLines={1}>{w.name}</Text>
              <Text style={styles.listMeta}>
                {[w.region, w.country].filter(Boolean).join(', ')}
                {formatVintageSuffix(w)}
              </Text>
            </View>
            <View style={styles.listRight}>
              <Text style={[styles.listType, { color: typeColor }]}>{labelMap[w.category] || w.category}</Text>
              {w.alcohol_pct && <Text style={styles.listAlc}>{w.alcohol_pct}%</Text>}
            </View>
          </Pressable>
        );
      })}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// "· 2015" for a vintage year, "· NV" / "· MV" for non/multi-vintage
// (stored in wines.metadata.vintage_type), empty when no vintage info.
function formatVintageSuffix(w: any): string {
  if (w?.vintage_year) return ` · ${w.vintage_year}`;
  const t = w?.metadata?.vintage_type;
  if (t === 'nv') return ' · NV';
  if (t === 'mv') return ' · MV';
  return '';
}

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#222', marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 22 },

  listItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
    gap: 12,
  },
  listDot: { width: 8, height: 8, borderRadius: 4 },
  listInfo: { flex: 1 },
  listName: { fontSize: 14, fontWeight: '600', color: '#222' },
  listMeta: { fontSize: 11, color: '#999', marginTop: 3 },
  listRight: { alignItems: 'flex-end' },
  listType: { fontSize: 11, fontWeight: '600' },
  listAlc: { fontSize: 10, color: '#bbb', marginTop: 2 },
});
