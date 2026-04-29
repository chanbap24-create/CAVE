import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';

interface Props {
  bullets: string[];
  onChange: (bullets: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  maxCharsPerItem?: number;
}

/**
 * 한 줄씩 추가/삭제 가능한 bullet list 입력. 트레바리 "이런 분께 추천" 등에 사용.
 * 입력 후 '추가' 버튼 또는 키보드 done.
 */
export function BulletEditor({
  bullets, onChange,
  placeholder = '한 줄씩 추가',
  maxItems = 8,
  maxCharsPerItem = 100,
}: Props) {
  const [draft, setDraft] = useState('');

  function add() {
    const v = draft.trim();
    if (!v) return;
    if (v.length > maxCharsPerItem) {
      Alert.alert('', `한 줄당 ${maxCharsPerItem}자 이하`);
      return;
    }
    if (bullets.length >= maxItems) {
      Alert.alert('', `최대 ${maxItems}개`);
      return;
    }
    onChange([...bullets, v]);
    setDraft('');
  }

  function remove(idx: number) {
    onChange(bullets.filter((_, i) => i !== idx));
  }

  return (
    <View>
      <View style={styles.list}>
        {bullets.map((b, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.text}>{b}</Text>
            <Pressable hitSlop={8} onPress={() => remove(i)}>
              <Text style={styles.x}>×</Text>
            </Pressable>
          </View>
        ))}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor="#bbb"
          maxLength={maxCharsPerItem}
          onSubmitEditing={add}
          returnKeyType="done"
        />
        <Pressable style={styles.addBtn} onPress={add}>
          <Text style={styles.addBtnText}>추가</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 6, marginBottom: 8 },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingVertical: 4,
  },
  dot: { fontSize: 14, color: '#7b2d4e', fontWeight: '700', marginTop: 1 },
  text: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
  x: { fontSize: 16, color: '#bbb', paddingHorizontal: 4 },

  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, fontSize: 14, backgroundColor: '#fafafa',
  },
  addBtn: { paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#7b2d4e', borderRadius: 10 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
