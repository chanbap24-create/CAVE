import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, Pressable, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useLogDrink } from '@/lib/hooks/useLogDrink';

interface Props {
  visible: boolean;
  /** 셀러에서 호출 시 collection id 전달. */
  collectionId: number | null;
  wineName?: string | null;
  onClose: () => void;
  onLogged?: () => void;
}

/**
 * 와인 한 잔/병을 마셨다고 기록하는 시트. 셀러 long-press 메뉴 또는 와인 상세에서 진입.
 * 입력: 별점(1~5) + 메모(1000자) + 날짜는 v1 에서 지금(현재 시점) 고정.
 *
 * 향후 v2: 직접 날짜 선택, 모임/식당 컨텍스트 태그.
 */
export function LogDrinkSheet({ visible, collectionId, wineName, onClose, onLogged }: Props) {
  const { log, saving } = useLogDrink();
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) { setRating(null); setNote(''); }
  }, [visible]);

  async function handleSave() {
    const ok = await log({ collectionId, rating, note });
    if (ok) { onLogged?.(); onClose(); }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Pressable onPress={onClose}><Text style={styles.cancel}>취소</Text></Pressable>
            <Text style={styles.title}>마셨다고 기록</Text>
            <Pressable onPress={handleSave} disabled={saving}>
              <Text style={[styles.submit, saving && { opacity: 0.5 }]}>{saving ? '...' : '저장'}</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {wineName ? <Text style={styles.wineName}>🍷 {wineName}</Text> : null}

            <Text style={styles.label}>별점</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map(i => (
                <Pressable key={i} onPress={() => setRating(rating === i ? null : i)} hitSlop={6}>
                  <Text style={[styles.star, (rating ?? 0) >= i ? styles.starOn : styles.starOff]}>★</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>한 줄 노트 (선택)</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              value={note}
              onChangeText={setNote}
              placeholder="첫인상, 페어링 음식, 마신 자리 등"
              placeholderTextColor="#bbb"
              multiline
              maxLength={1000}
            />
            <Text style={styles.helper}>지금 시점으로 기록됩니다 ({new Date().toLocaleString('ko-KR')})</Text>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  cancel: { fontSize: 15, color: '#999' },
  title: { fontSize: 16, fontWeight: '700', color: '#222' },
  submit: { fontSize: 15, fontWeight: '600', color: '#7b2d4e' },
  body: { padding: 20 },

  wineName: { fontSize: 14, color: '#7b2d4e', fontWeight: '600', marginBottom: 18 },

  label: { fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 8, marginTop: 4 },

  stars: { flexDirection: 'row', gap: 4, marginBottom: 18 },
  star: { fontSize: 32 },
  starOn: { color: '#f5a623' },
  starOff: { color: '#e0e0e0' },

  input: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, fontSize: 14, backgroundColor: '#fafafa',
  },
  helper: { fontSize: 11, color: '#999', marginTop: 8 },
});
