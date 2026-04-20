import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useMyCollectionPicker, type MyCollectionItem } from '@/lib/hooks/useMyCollectionPicker';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Single-pick callback. Fires the moment a row is tapped. */
  onPick?: (item: MyCollectionItem) => void;
  /** Multi-pick callback. When provided, rows behave as checkboxes and a
   *  confirm button fires with the accumulated selection. */
  onPickMultiple?: (items: MyCollectionItem[]) => void;
  /** Collection ids to hide from the list (already-picked wines). */
  excludeIds?: number[];
  title?: string;
}

/**
 * Modal list of the current user's cellar bottles. Reused across:
 *   - host slot selection at gathering create time (multi-pick)
 *   - attendee wine selection at apply time (single)
 *   - post-approval wine-change request (single)
 *
 * Multi-pick mode activates when `onPickMultiple` is passed instead of
 * `onPick`. Callers shouldn't pass both.
 */
export function MyCollectionPickerSheet({
  visible, onClose, onPick, onPickMultiple, excludeIds = [], title = 'Pick a wine',
}: Props) {
  const { items, loading } = useMyCollectionPicker(excludeIds);
  const multi = onPickMultiple != null;
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Reset selection whenever the sheet re-opens.
  useEffect(() => {
    if (visible) setSelectedIds(new Set());
  }, [visible]);

  function toggle(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleConfirmMulti() {
    const picked = items.filter(i => selectedIds.has(i.id));
    onPickMultiple!(picked);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        {multi && (
          <Text style={styles.subtitle}>여러 개 선택 가능 · 체크 후 아래 버튼으로 추가</Text>
        )}
        <ScrollView style={styles.list}>
          {loading && items.length === 0 ? (
            <Text style={styles.empty}>Loading...</Text>
          ) : items.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>셀러가 비어있어요</Text>
              <Text style={styles.emptyDesc}>먼저 와인을 셀러에 추가해주세요.</Text>
            </View>
          ) : (
            items.map(item => {
              const checked = selectedIds.has(item.id);
              return (
                <Pressable
                  key={item.id}
                  style={[styles.row, multi && checked && styles.rowChecked]}
                  onPress={() => (multi ? toggle(item.id) : onPick?.(item))}
                >
                  {multi && (
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  )}
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
              );
            })
          )}
          <View style={{ height: 20 }} />
        </ScrollView>

        {multi && (
          <View style={styles.footer}>
            <Pressable
              style={[styles.confirmBtn, selectedIds.size === 0 && { opacity: 0.4 }]}
              onPress={handleConfirmMulti}
              disabled={selectedIds.size === 0}
            >
              <Text style={styles.confirmText}>
                {selectedIds.size === 0 ? '와인을 선택해주세요' : `추가 (${selectedIds.size})`}
              </Text>
            </Pressable>
          </View>
        )}
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
    textAlign: 'center', paddingTop: 12,
  },
  subtitle: {
    fontSize: 11, color: '#999', textAlign: 'center',
    paddingTop: 4, paddingBottom: 10,
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
  rowChecked: { backgroundColor: '#fdf6f9' },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#ccc',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { borderColor: '#7b2d4e', backgroundColor: '#7b2d4e' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  thumb: { width: 44, height: 44, borderRadius: 8 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: '#222' },
  meta: { fontSize: 11, color: '#999', marginTop: 2 },

  footer: {
    padding: 16, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: '#efefef',
    backgroundColor: '#fff',
  },
  confirmBtn: {
    backgroundColor: '#7b2d4e', padding: 14, borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
