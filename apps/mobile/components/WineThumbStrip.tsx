import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

export interface WineThumb {
  id: number;
  is_blind: boolean;
  wine_name?: string | null;
  image_url?: string | null;
  photo_url?: string | null;
}

interface Props {
  wines: WineThumb[];
  total: number;
  /** Overall strip height — thumbs are square. Default 36. */
  size?: number;
  /** When true (on narrow spots like the card), we render +N as the 3rd slot. */
  compactOverflow?: boolean;
}

/**
 * Horizontal overlapped-thumbnail strip for showing committed wines
 * on a gathering card or summary. Blind slots render a padlock.
 * Shows `+N` overflow chip when total exceeds the rendered count.
 */
export function WineThumbStrip({ wines, total, size = 36, compactOverflow }: Props) {
  if (wines.length === 0 && total === 0) return null;

  // Reserve the last slot for the +N chip when compactOverflow and there are
  // more committed wines than we're rendering.
  const overflow = total - wines.length;
  const shown = compactOverflow && overflow > 0 ? wines.slice(0, wines.length - 1) : wines;
  const remainder = compactOverflow && overflow > 0
    ? overflow + (wines.length - shown.length)
    : overflow;

  return (
    <View style={[styles.row, { height: size }]}>
      {shown.map((w, i) => (
        <View
          key={w.id}
          style={[
            styles.thumbWrap,
            { width: size, height: size, borderRadius: size / 2, marginLeft: i === 0 ? 0 : -size / 3 },
          ]}
        >
          {w.is_blind ? (
            <View style={[styles.thumb, styles.blind, { borderRadius: size / 2 }]}>
              <Text style={{ fontSize: size * 0.4 }}>🔒</Text>
            </View>
          ) : w.photo_url || w.image_url ? (
            <Image
              source={w.photo_url ?? w.image_url!}
              style={[styles.thumb, { borderRadius: size / 2 }]}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.thumb, styles.placeholder, { borderRadius: size / 2 }]} />
          )}
        </View>
      ))}
      {remainder > 0 && (
        <View
          style={[
            styles.thumbWrap,
            styles.overflow,
            {
              width: size, height: size, borderRadius: size / 2,
              marginLeft: shown.length === 0 ? 0 : -size / 3,
            },
          ]}
        >
          <Text style={[styles.overflowText, { fontSize: size * 0.32 }]}>+{remainder}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  thumbWrap: {
    backgroundColor: '#fff',
    borderWidth: 2, borderColor: '#fff',
  },
  thumb: { width: '100%', height: '100%' },
  blind: {
    backgroundColor: '#f5f0e8',
    alignItems: 'center', justifyContent: 'center',
  },
  placeholder: { backgroundColor: '#f0f0f0' },
  overflow: {
    backgroundColor: '#fafafa',
    alignItems: 'center', justifyContent: 'center',
  },
  overflowText: { fontWeight: '700', color: '#666' },
});
