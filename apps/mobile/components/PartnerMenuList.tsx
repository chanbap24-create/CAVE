import React from 'react';
import { View, Text, Pressable, Switch, Alert, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import type { PartnerMenuItem } from '@/lib/hooks/usePartnerWineMenu';

interface Props {
  items: PartnerMenuItem[];
  onToggleAvailable: (id: number, next: boolean) => void;
  onRemove: (id: number) => void;
}

/**
 * 파트너 본인 판매 메뉴 리스트 — owner view.
 * 가격 + available 토글 + long-press 삭제.
 *
 * 가격 수정은 v2 (현재는 삭제 후 재등록).
 */
export function PartnerMenuList({ items, onToggleAvailable, onRemove }: Props) {
  function confirmRemove(item: PartnerMenuItem) {
    Alert.alert(
      '메뉴에서 제거',
      `${item.wine?.name ?? '이 와인'}을 판매 메뉴에서 제거할까요?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '제거', style: 'destructive', onPress: () => onRemove(item.id) },
      ],
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>등록된 판매 와인이 없어요</Text>
        <Text style={styles.emptyHint}>
          우상단 + 버튼으로 와인을 검색해 가격과 함께 등록하세요.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {items.map(item => (
        <Pressable
          key={item.id}
          style={styles.row}
          onLongPress={() => confirmRemove(item)}
        >
          {item.wine?.image_url ? (
            <Image source={item.wine.image_url} style={styles.thumb} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]} />
          )}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{item.wine?.name ?? '와인'}</Text>
            {item.wine?.producer && (
              <Text style={styles.producer} numberOfLines={1}>{item.wine.producer}</Text>
            )}
            <Text style={styles.price}>
              {item.price.toLocaleString('ko-KR')}원
            </Text>
          </View>
          <Switch
            value={item.available}
            onValueChange={(v) => onToggleAvailable(item.id, v)}
            trackColor={{ true: '#7b2d4e', false: '#ddd' }}
          />
        </Pressable>
      ))}
      <Text style={styles.footer}>길게 눌러 삭제</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  thumb: { width: 44, height: 44, borderRadius: 6, backgroundColor: '#f0eaec' },
  thumbPlaceholder: {},
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: '#222' },
  producer: { fontSize: 11, color: '#999', marginTop: 2 },
  price: { fontSize: 13, fontWeight: '700', color: '#7b2d4e', marginTop: 4 },
  footer: { fontSize: 11, color: '#bbb', textAlign: 'center', paddingVertical: 12 },

  empty: { paddingHorizontal: 24, paddingVertical: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: '#444' },
  emptyHint: { fontSize: 12, color: '#999', marginTop: 6, textAlign: 'center', lineHeight: 18 },
});
