import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCellarActivity, type CellarActivityItem } from '@/lib/hooks/useCellarActivity';
import { CATEGORY_BG_COLORS } from '@/lib/constants/drinkCategories';

/**
 * Home-screen horizontal strip of recent cellar additions from follows.
 * Tap a card → jump to the owner's profile where they can like/comment.
 * The strip is intentionally light: thumbnail + owner + wine name, no
 * social interactions on the card itself so the main feed remains the
 * surface for posts.
 */
export function CellarActivityStrip() {
  const router = useRouter();
  const { items, loading } = useCellarActivity();

  if (!loading && items.length === 0) return null; // stay invisible when empty

  return (
    <View style={styles.wrap}>
      <Text style={styles.header}>Recent Additions</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {items.map(item => (
          <ActivityCard
            key={item.id}
            item={item}
            onPress={() => router.push(`/user/${item.user_id}`)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function ActivityCard({ item, onPress }: { item: CellarActivityItem; onPress: () => void }) {
  const photo = item.photo_url || item.wine?.image_url || null;
  const bg = CATEGORY_BG_COLORS[item.wine?.category ?? 'other'] ?? '#f0f0f0';

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {photo ? (
        <Image source={photo} style={styles.thumb} contentFit="cover" cachePolicy="memory-disk" />
      ) : (
        <View style={[styles.thumb, { backgroundColor: bg }]} />
      )}
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
});
