import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import type { WineTag } from '@/lib/hooks/useWineTagSearch';

interface Props {
  tagSearch: string;
  tagResults: WineTag[];
  taggedWine: WineTag | null;
  onSearch: (query: string) => void;
  onSelect: (wine: WineTag) => void;
  onClear: () => void;
}

export function WineTagPicker({
  tagSearch,
  tagResults,
  taggedWine,
  onSearch,
  onSelect,
  onClear,
}: Props) {
  return (
    <View style={styles.tagSection}>
      <Text style={styles.tagLabel}>주류 태그</Text>
      {taggedWine ? (
        <View style={styles.taggedRow}>
          <View style={styles.taggedBadge}>
            <Text style={styles.taggedText}>{taggedWine.name}</Text>
          </View>
          <Pressable onPress={onClear}>
            <Text style={styles.tagRemove}>Remove</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.tagInput}
            placeholder="Search to tag..."
            placeholderTextColor="#bbb"
            value={tagSearch}
            onChangeText={onSearch}
          />
          {tagResults.map(w => (
            <Pressable key={w.id} style={styles.tagResult} onPress={() => onSelect(w)}>
              <Text style={styles.tagResultName}>{w.name}</Text>
              {w.name_ko && <Text style={styles.tagResultKo}>{w.name_ko}</Text>}
            </Pressable>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tagSection: { paddingHorizontal: 16, paddingBottom: 20 },
  tagLabel: { fontSize: 13, fontWeight: '600', color: '#999', marginBottom: 8 },
  tagInput: {
    backgroundColor: '#f5f5f5', borderRadius: 10,
    padding: 10, paddingLeft: 16, fontSize: 14,
  },
  tagResult: {
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  tagResultName: { fontSize: 14, fontWeight: '500', color: '#222' },
  tagResultKo: { fontSize: 11, color: '#999', marginTop: 2 },
  taggedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taggedBadge: {
    backgroundColor: '#f7f0f3', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8,
  },
  taggedText: { fontSize: 13, fontWeight: '500', color: '#7b2d4e' },
  tagRemove: { fontSize: 12, color: '#ed4956', fontWeight: '500' },
});
