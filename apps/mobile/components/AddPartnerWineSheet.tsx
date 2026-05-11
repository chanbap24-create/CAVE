import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, Modal, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useWineSearch, type WineSearchResult } from '@/lib/hooks/useWineSearch';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** 등록 성공 시 호출. 부모가 list refresh 트리거. */
  onAdded: () => void;
  /** 등록 함수 — 부모(usePartnerWineMenu) 가 주입. */
  add: (wineId: number, price: number) => Promise<boolean>;
}

/**
 * 판매 와인 등록 시트 — 두 단계.
 *  1. 와인 검색 → 선택
 *  2. 가격 입력 → 등록
 *
 * 가격은 원 단위 정수. 빈 문자열이거나 숫자 아니면 비활성화.
 */
export function AddPartnerWineSheet({ visible, onClose, onAdded, add }: Props) {
  const { results, loading, searchWines, clearResults } = useWineSearch();
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<WineSearchResult | null>(null);
  const [priceText, setPriceText] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setQuery(''); clearResults();
    setPicked(null); setPriceText(''); setSaving(false);
  }

  function close() { reset(); onClose(); }

  function handleQuery(t: string) {
    setQuery(t);
    if (t.trim().length < 2) clearResults();
    else searchWines(t.trim(), 20);
  }

  async function handleSave() {
    if (!picked) return;
    const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
    if (Number.isNaN(price) || price < 0) return;
    setSaving(true);
    const ok = await add(picked.id, price);
    setSaving(false);
    if (ok) { onAdded(); close(); }
  }

  const priceValid = (() => {
    const n = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
    return !Number.isNaN(n) && n >= 0;
  })();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Pressable onPress={picked ? () => setPicked(null) : close} hitSlop={8}>
              <Text style={styles.headerBtn}>{picked ? '뒤로' : '취소'}</Text>
            </Pressable>
            <Text style={styles.title}>{picked ? '가격 입력' : '와인 검색'}</Text>
            <View style={{ width: 40 }} />
          </View>

          {!picked ? (
            <>
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={handleQuery}
                placeholder="와인 이름 / 생산자"
                placeholderTextColor="#bbb"
                autoCapitalize="none"
                autoFocus
              />
              {loading && <ActivityIndicator color="#7b2d4e" style={{ marginTop: 12 }} />}
              <FlatList
                data={results}
                keyExtractor={r => String(r.id)}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 360 }}
                renderItem={({ item }) => (
                  <Pressable style={styles.row} onPress={() => setPicked(item)}>
                    <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                    {item.name_ko && <Text style={styles.rowNameKo} numberOfLines={1}>{item.name_ko}</Text>}
                    <Text style={styles.rowMeta}>
                      {[item.country, item.region].filter(Boolean).join(' · ') || '지역 정보 없음'}
                    </Text>
                  </Pressable>
                )}
              />
            </>
          ) : (
            <View style={styles.pickedWrap}>
              <Text style={styles.pickedName}>{picked.name}</Text>
              {picked.name_ko && <Text style={styles.pickedNameKo}>{picked.name_ko}</Text>}
              <Text style={styles.pickedMeta}>
                {[picked.country, picked.region].filter(Boolean).join(' · ') || '지역 정보 없음'}
              </Text>

              <Text style={styles.priceLabel}>판매 가격 (원)</Text>
              <TextInput
                style={styles.priceInput}
                value={priceText}
                onChangeText={setPriceText}
                placeholder="예: 35000"
                placeholderTextColor="#bbb"
                keyboardType="number-pad"
                autoFocus
              />

              <Pressable
                style={[styles.saveBtn, (!priceValid || saving) && { opacity: 0.4 }]}
                onPress={handleSave}
                disabled={!priceValid || saving}
              >
                <Text style={styles.saveText}>{saving ? '...' : '등록'}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '85%' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 16,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  headerBtn: { fontSize: 13, fontWeight: '600', color: '#7b2d4e', width: 40 },
  title: { fontSize: 14, fontWeight: '700', color: '#222' },

  input: {
    marginHorizontal: 16, marginTop: 12,
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, fontSize: 14, backgroundColor: '#fafafa',
  },
  row: {
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  rowName: { fontSize: 14, fontWeight: '600', color: '#222' },
  rowNameKo: { fontSize: 12, color: '#666', marginTop: 2 },
  rowMeta: { fontSize: 11, color: '#999', marginTop: 4 },

  pickedWrap: { padding: 20 },
  pickedName: { fontSize: 16, fontWeight: '700', color: '#222' },
  pickedNameKo: { fontSize: 13, color: '#666', marginTop: 4 },
  pickedMeta: { fontSize: 12, color: '#999', marginTop: 6 },

  priceLabel: { fontSize: 12, fontWeight: '600', color: '#999', marginTop: 24, marginBottom: 6 },
  priceInput: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, fontSize: 18, backgroundColor: '#fafafa',
  },
  saveBtn: {
    marginTop: 20, backgroundColor: '#7b2d4e',
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
