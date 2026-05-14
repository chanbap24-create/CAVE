import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 4) / 3;

export interface CellarGridItem {
  id: number;
  photo_url: string | null;
  wine?: {
    name?: string | null;
    image_url?: string | null;
    category?: string | null;
  } | null;
}

interface Props {
  collections: CellarGridItem[];
  /** 빈 상태 메시지 (예: 본인 — "라벨 스캔으로 첫 와인 추가" / 타인 — "공유된 와인 없음"). */
  emptyText?: string;
}

/**
 * Instagram-style 3-column grid of cellar bottles.
 * 각 셀: collection.photo_url (사용자 사진) ↦ wines.image_url (공용 이미지) ↦ placeholder.
 * 탭 → /wine/[collectionId] 디테일.
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

  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#999' },
});
