import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import {
  useCellarActivity,
  type CellarActivityItem,
  type CellarActivityGroup,
} from '@/lib/hooks/useCellarActivity';
import { CATEGORY_BG_COLORS } from '@/lib/constants/drinkCategories';
import { CollectionDetailSheet } from '@/components/CollectionDetailSheet';

/**
 * Home-screen horizontal strip of recent cellar additions from follows.
 * Tap a card → opens the CollectionDetailSheet so viewers can like /
 * comment without jumping away from the feed. The card itself stays
 * light (thumbnail + owner + wine name) so the strip is visually calm.
 */
export function CellarActivityStrip() {
  const { groups, loading } = useCellarActivity();
  const [active, setActive] = useState<CellarActivityGroup | null>(null);

  if (!loading && groups.length === 0) return null; // stay invisible when empty

  return (
    <View style={styles.wrap}>
      <Text style={styles.header}>Recent Additions</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {groups.map(g => (
          <ActivityCard
            key={g.user_id}
            item={g.latest}
            extraCount={g.entries.length - 1}
            onPress={() => setActive(g)}
          />
        ))}
      </ScrollView>

      <CollectionDetailSheet
        visible={active != null}
        entries={active?.entries ?? []}
        onClose={() => setActive(null)}
      />
    </View>
  );
}

function ActivityCard({
  item, extraCount, onPress,
}: { item: CellarActivityItem; extraCount: number; onPress: () => void }) {
  const photo = item.photo_url || item.wine?.image_url || null;
  const bg = CATEGORY_BG_COLORS[item.wine?.category ?? 'other'] ?? '#f0f0f0';

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View>
        {photo ? (
          <Image source={photo} style={styles.thumb} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={[styles.thumb, { backgroundColor: bg }]} />
        )}
        {extraCount > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>+{extraCount}</Text>
          </View>
        )}
      </View>
      <Text style={styles.wineName} numberOfLines={1}>{item.wine?.name ?? 'Unknown'}</Text>
      <View style={styles.ownerRow}>
        {item.owner?.avatar_url ? (
          <Image
            source={item.owner.avatar_url}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: '#e0e0e0' }]} />
        )}
        <Text style={styles.ownerName} numberOfLines={1}>
          {item.owner?.display_name || item.owner?.username || ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  header: {
    fontSize: 13, fontWeight: '700', color: '#222',
    paddingHorizontal: 20, marginBottom: 10,
  },
  row: { paddingHorizontal: 16, gap: 12 },
  card: { width: 120 },
  thumb: { width: 120, height: 120, borderRadius: 10, backgroundColor: '#f5f5f5' },
  wineName: { fontSize: 12, fontWeight: '600', color: '#222', marginTop: 6 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  avatar: { width: 16, height: 16, borderRadius: 8 },
  ownerName: { flex: 1, fontSize: 11, color: '#999' },

  countBadge: {
    position: 'absolute', right: 6, top: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
