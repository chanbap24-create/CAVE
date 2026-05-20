import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';

interface Props {
  categories: readonly string[];
  active: string;
  onChange: (category: string) => void;
}

/** Horizontal chip row for filtering by drink category. */
export function CategoryChips({ categories, active, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {categories.map(c => (
        <Pressable
          key={c}
          style={[styles.btn, active === c && styles.btnActive]}
          onPress={() => onChange(c)}
        >
          <Text style={[styles.text, active === c && styles.textActive]}>{c}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, marginBottom: 4 },
  btn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#FFE5D9',
  },
  btnActive: { backgroundColor: '#FF6B4A' },
  text: { fontSize: 13, fontWeight: '700', color: '#8A7868' },
  textActive: { color: '#fff' },
});
