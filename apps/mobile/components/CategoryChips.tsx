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
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: '#efefef', backgroundColor: '#fff',
  },
  btnActive: { backgroundColor: '#222', borderColor: '#222' },
  text: { fontSize: 13, fontWeight: '500', color: '#999' },
  textActive: { color: '#fff' },
});
