import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

interface WineRow {
  id: number;
  photo_url: string | null;
  created_at: string;
  tasting_note?: string | null;
  tasting_note_updated_at?: string | null;
  wine?: {
    name: string;
    producer?: string | null;
    vintage_year?: number | null;
    image_url?: string | null;
    region?: string | null;
    country?: string | null;
  } | null;
}

interface Props {
  wines: WineRow[];
}

/**
 * Single-wine hero block for the Cave home. Picks the most recently
 * tasted bottle (by tasting_note_updated_at) when there is a note;
 * otherwise falls back to the most recently added. Renders a big photo
 * with a snippet of the note so the page feels curated instead of
 * database-ish.
 *
 * Tapping routes to /wine/[id]. Silent when the cellar is empty so the
 * rest of the screen doesn't reserve awkward space.
 */
export function TodaysPickHero({ wines }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const pick = useMemo(() => pickFeatured(wines), [wines]);
  if (!pick) return null;

  const photo = pick.photo_url ?? pick.wine?.image_url ?? null;
  const note = pick.tasting_note?.trim();
  const locale = [pick.wine?.region, pick.wine?.country].filter(Boolean).join(', ');

  return (
    <Pressable
      style={({ pressed }) => [styles.wrap, pressed && styles.wrapPressed]}
      onPress={() => router.push(`/wine/${pick.id}`)}
    >
      <Text style={styles.label}>Today's Pick</Text>
      <View style={[styles.card, { minHeight: Math.min(width * 0.55, 260) }]}>
        {photo ? (
          <Image source={photo} style={styles.photo} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]} />
        )}

        <View style={styles.info}>
          {pick.wine?.producer ? (
            <Text style={styles.producer}>{pick.wine.producer}</Text>
          ) : null}
          <Text style={styles.name} numberOfLines={2}>{pick.wine?.name ?? 'Unknown'}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {locale || 'Region unknown'}
            {pick.wine?.vintage_year ? ` · ${pick.wine.vintage_year}` : ''}
          </Text>
          {note ? (
            <Text style={styles.note} numberOfLines={3}>"{note}"</Text>
          ) : (
            <Text style={styles.noteEmpty}>탭하여 노트 작성</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function pickFeatured(wines: WineRow[]): WineRow | null {
  if (!wines || wines.length === 0) return null;
  const withNote = wines
    .filter(w => w.tasting_note && w.tasting_note_updated_at)
    .sort((a, b) =>
      (b.tasting_note_updated_at ?? '').localeCompare(a.tasting_note_updated_at ?? '')
    );
  if (withNote[0]) return withNote[0];
  // Fallback: newest addition. Assumes caller passed ordered or unordered
  // data; we re-sort defensively.
  return [...wines].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
  },
  wrapPressed: { opacity: 0.8 },
  label: {
    fontSize: 11, fontWeight: '700', color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
  },
  card: {
    flexDirection: 'row', gap: 14,
    backgroundColor: '#fafafa', borderRadius: 14,
    padding: 12,
  },
  photo: {
    width: 110, aspectRatio: 3 / 4,
    borderRadius: 10, backgroundColor: '#eee',
  },
  photoPlaceholder: { backgroundColor: '#eee' },
  info: { flex: 1, justifyContent: 'flex-start', paddingTop: 4 },
  producer: {
    fontSize: 11, fontWeight: '700', color: '#7b2d4e',
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4,
  },
  name: { fontSize: 17, fontWeight: '700', color: '#222', lineHeight: 22 },
  meta: { fontSize: 12, color: '#999', marginTop: 4 },
  note: { fontSize: 13, color: '#444', marginTop: 10, lineHeight: 19, fontStyle: 'italic' },
  noteEmpty: { fontSize: 12, color: '#bbb', marginTop: 10 },
});
