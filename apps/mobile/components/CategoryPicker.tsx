import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { DrinkCategory } from '@/lib/hooks/useDrinkCategories';

interface Props {
  categories: DrinkCategory[];
  selected: string | null;
  onChange: (key: string | null) => void;
}

export function CategoryPicker({ categories, selected, onChange }: Props) {
  if (categories.length === 0) return null;

  return (
    <View style={styles.categorySection}>
      <Text style={styles.tagLabel}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 16 }}
      >
        {categories.map(c => {
          const active = selected === c.key;
          const bg = c.bg_color ?? '#f0f0f0';
          const color = c.text_color ?? '#666';
          return (
            <Pressable
              key={c.key}
              onPress={() => onChange(active ? null : c.key)}
              style={[
                styles.categoryChip,
                active && { backgroundColor: bg, borderColor: color },
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  active && { color, fontWeight: '700' },
                ]}
              >
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  categorySection: { paddingHorizontal: 16, paddingBottom: 12 },
  tagLabel: { fontSize: 13, fontWeight: '600', color: '#999', marginBottom: 8 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
    borderWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa',
  },
  categoryChipText: { fontSize: 12, fontWeight: '500', color: '#666' },
});
