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
import { PartnerBadge } from '@/components/PartnerBadge';

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
      <View style={styles.thumbWrap}>
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
        {/* Bottom scrim + wine name inside the photo — matches
            RecentlyAddedRow so the two strips read consistently. */}
        <View style={styles.scrim}>
          <Text style={styles.overlayName} numberOfLines={2}>
            {item.wine?.name ?? 'Unknown'}
          </Text>
        </View>
      </View>
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
        {item.owner?.is_partner ? (
          <PartnerBadge label={item.owner.partner_label} size="sm" />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 10, paddingBottom: 8 },
  header: {
    fontSize: 11, fontWeight: '700', color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 20, marginBottom: 6,
  },
  row: { paddingHorizontal: 16, gap: 12 },
  card: { width: 120 },
  thumbWrap: {
    width: 120, height: 120, borderRadius: 10, overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  thumb: { width: '100%', height: '100%' },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  avatar: { width: 16, height: 16, borderRadius: 8 },
  ownerName: { flex: 1, fontSize: 11, color: '#999' },

  // Same treatment as RecentlyAddedRow — fixed-height low-opacity scrim +
  // text shadow keeps the wine name readable across any artwork.
  scrim: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    height: 40,
    paddingHorizontal: 8, paddingTop: 5,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'flex-start',
  },
  overlayName: {
    fontSize: 11, fontWeight: '700', color: '#fff', lineHeight: 14,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 2,
  },

  countBadge: {
    position: 'absolute', right: 6, top: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
