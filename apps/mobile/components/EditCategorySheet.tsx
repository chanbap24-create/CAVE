import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useDrinkCategories } from '@/lib/hooks/useDrinkCategories';

interface Props {
  visible: boolean;
  postId: number;
  initialCategory: string | null;
  onClose: () => void;
  onSaved: (newCategory: string | null) => void;
}

export function EditCategorySheet({ visible, postId, initialCategory, onClose, onSaved }: Props) {
  const { categories } = useDrinkCategories();
  const [selected, setSelected] = useState<string | null>(initialCategory);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setSelected(initialCategory); }, [initialCategory, visible]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from('posts')
      .update({ category: selected })
      .eq('id', postId);
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    onSaved(selected);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Edit Category</Text>
          <Pressable onPress={save} disabled={saving} hitSlop={8}>
            {saving
              ? <ActivityIndicator size="small" color="#7b2d4e" />
              : <Text style={styles.save}>Save</Text>}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.chipWrap}>
            {categories.map(c => {
              const active = selected === c.key;
              const bg = c.bg_color ?? '#f0f0f0';
              const color = c.text_color ?? '#666';
              return (
                <Pressable
                  key={c.key}
                  onPress={() => setSelected(active ? null : c.key)}
                  style={[
                    styles.chip,
                    active && { backgroundColor: bg, borderColor: color },
                  ]}
                >
                  <Text style={[styles.chipText, active && { color, fontWeight: '700' }]}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>
            Tap a category to change it. Tap again to clear.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  cancel: { fontSize: 15, color: '#999' },
  title: { fontSize: 16, fontWeight: '700', color: '#222' },
  save: { fontSize: 15, fontWeight: '600', color: '#7b2d4e' },

  body: { paddingHorizontal: 20, paddingTop: 20 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    borderWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa',
  },
  chipText: { fontSize: 13, fontWeight: '500', color: '#666' },

  hint: { fontSize: 12, color: '#999', marginTop: 16, textAlign: 'center' },
});
