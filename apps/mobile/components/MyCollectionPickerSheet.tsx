import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useMyCollectionPicker, type MyCollectionItem } from '@/lib/hooks/useMyCollectionPicker';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPick: (item: MyCollectionItem) => void;
  /** Collection ids to hide from the list (already-picked wines). */
  excludeIds?: number[];
  title?: string;
}

/**
 * Modal list of the current user's cellar bottles. Reused across:
 *   - host slot selection at gathering create time
 *   - attendee wine selection at apply time
 *   - post-approval wine-change request
 */
export function MyCollectionPickerSheet({
  visible, onClose, onPick, excludeIds = [], title = 'Pick a wine',
}: Props) {
  const { items, loading } = useMyCollectionPicker(excludeIds);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        <ScrollView style={styles.list}>
          {loading && items.length === 0 ? (
            <Text style={styles.empty}>Loading...</Text>
          ) : items.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>셀러가 비어있어요</Text>
              <Text style={styles.emptyDesc}>먼저 와인을 셀러에 추가해주세요.</Text>
            </View>
          ) : (
            items.map(item => (
              <Pressable
                key={item.id}
                style={styles.row}
                onPress={() => onPick(item)}
              >
                {item.photo_url || item.wine?.image_url ? (
                  <Image
                    source={item.photo_url ?? item.wine?.image_url!}
                    style={styles.thumb}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: '#f0f0f0' }]} />
                )}
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>{item.wine?.name ?? '—'}</Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {[item.wine?.region, item.wine?.country].filter(Boolean).join(', ')}
                    {item.wine?.vintage_year ? ` · ${item.wine.vintage_year}` : ''}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10 },
  title: {
    fontSize: 15, fontWeight: '700', color: '#222',
    textAlign: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  list: { paddingHorizontal: 16 },
  empty: { textAlign: 'center', color: '#bbb', paddingVertical: 32, fontSize: 13 },
  emptyBox: { paddingVertical: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#999' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  thumb: { width: 44, height: 44, borderRadius: 8 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: '#222' },
  meta: { fontSize: 11, color: '#999', marginTop: 2 },
});
