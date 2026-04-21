import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

interface WineRow {
  id: number;
  photo_url: string | null;
  created_at: string;
  wine?: {
    name: string;
    producer?: string | null;
    vintage_year?: number | null;
    image_url?: string | null;
  } | null;
}

interface Props {
  wines: WineRow[];
  /** Optional override label. Defaults to "Recently Added". */
  label?: string;
  /** Latest N → horizontal strip. */
  limit?: number;
}

/**
 * Aesop-style horizontal strip of the cellar's most recent additions.
 * Portrait 3:4 cards, minimal type — producer + vintage only, no
 * decorative chrome. Meant to make the Cave home feel curated rather
 * than database-y while staying minimalist.
 */
export function RecentlyAddedRow({ wines, label = 'Recently Added', limit = 8 }: Props) {
  const router = useRouter();
  const items = [...wines]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {items.map(w => {
          const photo = w.photo_url ?? w.wine?.image_url ?? null;
          return (
            <Pressable
              key={w.id}
              style={styles.card}
              onPress={() => router.push(`/wine/${w.id}`)}
            >
              <View style={styles.photoWrap}>
                {photo ? (
                  <Image
                    source={photo}
                    style={styles.photo}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={[styles.photo, styles.photoPlaceholder]} />
                )}
                {/* Semi-opaque scrim + label overlay at the bottom of the
                    photo so the wine name reads against any artwork. */}
                <View style={styles.scrim}>
                  <Text style={styles.overlayName} numberOfLines={2}>
                    {w.wine?.name ?? 'Unknown'}
                  </Text>
                  {w.wine?.vintage_year ? (
                    <Text style={styles.overlayMeta}>{w.wine.vintage_year}</Text>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 10, paddingBottom: 4 },
  label: {
    fontSize: 11, fontWeight: '700', color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 20, marginBottom: 6,
  },
  row: { paddingHorizontal: 16, gap: 12 },
  card: { width: 110 },
  photoWrap: {
    width: 110, aspectRatio: 3 / 4,
    borderRadius: 8, overflow: 'hidden',
    backgroundColor: '#eee',
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { backgroundColor: '#eee' },

  // Fixed-height scrim so every card matches regardless of whether the
  // wine has a vintage line. Lighter opacity than before — just enough
  // to separate white text from the photo.
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
  overlayMeta: {
    fontSize: 9, color: 'rgba(255,255,255,0.9)', marginTop: 1, fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 2,
  },
});
