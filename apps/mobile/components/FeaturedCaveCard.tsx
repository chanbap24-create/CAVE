import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import type { FeaturedCave } from '@/lib/hooks/useFeaturedCaves';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.52;

const bgByCategory: Record<string, string> = {
  wine: '#e8d5c4',
  whiskey: '#d4c0a0',
  sake: '#d8dce8',
  cognac: '#ede5d8',
  other: '#e0e0e0',
};

export function FeaturedCaveCard({ cave }: { cave: FeaturedCave }) {
  const router = useRouter();
  const initial = cave.display_name?.[0]?.toUpperCase() || cave.username[0]?.toUpperCase() || '?';
  const bg = bgByCategory[cave.top_category || 'other'] || '#e0e0e0';

  const desc = [
    cave.countries > 0 ? `${cave.countries} countries` : null,
    `${cave.collection_count} bottles`,
  ].filter(Boolean).join(', ');

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/user/${cave.user_id}`)}>
      <View style={[styles.bg, { backgroundColor: bg }]} />
      <View style={styles.overlay}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{cave.username}</Text>
        <Text style={styles.desc}>{desc}</Text>
        {cave.badges.length > 0 && (
          <View style={styles.badges}>
            {cave.badges.map((b, i) => (
              <View key={i} style={styles.badge}>
                <Text style={styles.badgeText}>{b}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH, height: 240, borderRadius: 16,
    overflow: 'hidden', position: 'relative',
  },
  bg: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, backgroundColor: 'rgba(0,0,0,0.35)',
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff', marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  name: { fontSize: 14, fontWeight: '600', color: '#fff' },
  desc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  badges: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#fff' },
});
