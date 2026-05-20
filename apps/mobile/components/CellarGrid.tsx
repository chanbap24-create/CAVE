import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 4) / 3;

export interface CellarGridItem {
  id: number;
  photo_url: string | null;
  /** 보유 수량 — 2 이상이면 우상단 ×N 배지 노출. */
  quantity?: number | null;
  wine?: {
    name?: string | null;
    image_url?: string | null;
    category?: string | null;
  } | null;
}

interface Props {
  collections: CellarGridItem[];
  emptyText?: string;
}

/**
 * Instagram-style 3-column grid of cellar bottles.
 * 한 row = 한 와인. quantity > 1 이면 우상단에 ×N 배지로 보유 수량 표시.
 */
export function CellarGrid({ collections, emptyText = '아직 등록된 와인이 없어요' }: Props) {
  const router = useRouter();

  if (collections.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {collections.map(c => {
        const src = c.photo_url || c.wine?.image_url || null;
        const qty = c.quantity ?? 1;
        return (
          <Pressable
            key={c.id}
            style={styles.item}
            onPress={() => router.push(`/wine/${c.id}?from=profile` as any)}
          >
            {src ? (
              <Image source={src} style={styles.image} contentFit="cover" cachePolicy="memory-disk" transition={120} />
            ) : (
              <View style={[styles.image, styles.placeholder]}>
                <Text style={styles.placeholderText} numberOfLines={2}>
                  {c.wine?.name ?? '와인'}
                </Text>
              </View>
            )}
            {qty > 1 ? (
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyText}>×{qty}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 2,
    borderTopWidth: 1, borderTopColor: '#efefef',
  },
  item: { width: ITEM_SIZE, height: ITEM_SIZE, position: 'relative' },
  image: { width: '100%', height: '100%', backgroundColor: '#f5f0f2' },
  placeholder: { alignItems: 'center', justifyContent: 'center', padding: 6 },
  placeholderText: { fontSize: 10, color: '#999', textAlign: 'center', lineHeight: 13 },

  // 우상단 보유 수량 배지
  qtyBadge: {
    position: 'absolute',
    top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 10,
  },
  qtyText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },

  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#999' },
});
