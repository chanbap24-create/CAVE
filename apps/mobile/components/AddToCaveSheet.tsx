import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { sanitizeSearch } from '@/lib/utils/searchUtils';
import { useAddToCave } from '@/lib/hooks/useAddToCave';

import { CATEGORY_BG_COLORS, CATEGORY_TAG_STYLES, CATEGORY_LABELS } from '@/lib/constants/drinkCategories';

const bgColors = CATEGORY_BG_COLORS;
const tagStyles = CATEGORY_TAG_STYLES;
const labelMap = CATEGORY_LABELS;

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
  existingIds: Set<number>;
}

export function AddToCaveSheet({ visible, onClose, onAdded, existingIds }: Props) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [addingId, setAddingId] = useState<number | null>(null);
  const { addExisting } = useAddToCave();

  async function searchDrinks(query: string) {
    setSearch(query);
    if (query.length < 2) { setResults([]); return; }
    const q = sanitizeSearch(query);
    const { data } = await supabase
      .from('wines')
      .select('*')
      .or(`name.ilike.%${q}%,name_ko.ilike.%${q}%,producer.ilike.%${q}%`)
      .order('name')
      .limit(20);
    if (data) setResults(data);
  }

  async function addToCave(wineId: number) {
    if (addingId) return;
    setAddingId(wineId);
    const ok = await addExisting({ wineId, source: 'search' });
    setAddingId(null);
    if (ok) onAdded();
  }

  function handleClose() {
    setSearch('');
    setResults([]);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Add to Cave</Text>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            placeholderTextColor="#bbb"
            value={search}
            onChangeText={searchDrinks}
            autoFocus
          />
        </View>

        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {results.length === 0 && search.length >= 2 && (
            <Text style={styles.empty}>No results</Text>
          )}
          {results.map(d => {
            const inCave = existingIds.has(d.id);
            const tag = tagStyles[d.category] || tagStyles.other;
            const label = labelMap[d.category] || d.category;
            return (
              <View key={d.id} style={styles.item}>
                <View style={[styles.thumb, { backgroundColor: bgColors[d.category] || '#f0f0f0' }]} />
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>{d.name}</Text>
                  {d.name_ko && <Text style={styles.nameKo}>{d.name_ko}</Text>}
                  <Text style={styles.meta}>{[d.region, d.country].filter(Boolean).join(', ')}</Text>
                  <View style={[styles.catTag, { backgroundColor: tag.bg }]}>
                    <Text style={[styles.catText, { color: tag.color }]}>{label}</Text>
                  </View>
                </View>
                {inCave ? (
                  <View style={styles.addedBtn}>
                    <Text style={styles.addedText}>Added</Text>
                  </View>
                ) : (
                  <Pressable
                    style={[styles.addBtn, addingId === d.id && { opacity: 0.5 }]}
                    onPress={() => addToCave(d.id)}
                    disabled={addingId === d.id}
                  >
                    <Text style={styles.addBtnText}>+ Add</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '80%', minHeight: '50%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10,
  },
  title: {
    fontSize: 15, fontWeight: '700', color: '#222',
    textAlign: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  searchBox: { padding: 12, paddingHorizontal: 16 },
  searchInput: {
    backgroundColor: '#f5f5f5', borderRadius: 10,
    padding: 10, paddingLeft: 16, fontSize: 14,
  },
  list: { flex: 1 },
  empty: { textAlign: 'center', color: '#bbb', paddingVertical: 40, fontSize: 14 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, paddingHorizontal: 16, gap: 14,
    borderBottomWidth: 1, borderBottomColor: '#f8f8f8',
  },
  thumb: { width: 48, height: 48, borderRadius: 10 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: '#222' },
  nameKo: { fontSize: 11, color: '#aaa', marginTop: 1 },
  meta: { fontSize: 11, color: '#999', marginTop: 3 },
  catTag: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  catText: { fontSize: 10, fontWeight: '600' },
  addBtn: { backgroundColor: '#7b2d4e', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  addedBtn: { backgroundColor: '#f0f0f0', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  addedText: { color: '#999', fontSize: 12, fontWeight: '600' },
});
