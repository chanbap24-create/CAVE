import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { CardTemplatePicker } from '@/components/CardTemplatePicker';
import { useDefaultCardTemplate } from '@/lib/hooks/useDefaultCardTemplate';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * 프로필 → "내 카드 디자인" 시트.
 * 호스트의 시그니처 템플릿을 정해두면, 모임 개설 시 폼이 그 디자인으로
 * 자동 채워짐 (개별 모임에서 변경 가능).
 */
export function CardTemplateDefaultSheet({ visible, onClose }: Props) {
  const { defaultCardTemplate, saveDefault } = useDefaultCardTemplate();
  const [selected, setSelected] = useState<string>(defaultCardTemplate);
  const [saving, setSaving] = useState(false);

  // 시트 열릴 때마다 현재 default 로 초기화 (다른 곳에서 바뀐 값을 반영)
  useEffect(() => {
    if (visible) setSelected(defaultCardTemplate);
  }, [visible, defaultCardTemplate]);

  async function handleSave() {
    setSaving(true);
    const ok = await saveDefault(selected);
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Pressable onPress={onClose}>
              <Text style={styles.cancel}>취소</Text>
            </Pressable>
            <Text style={styles.title}>내 카드 디자인</Text>
            <Pressable onPress={handleSave} disabled={saving}>
              <Text style={[styles.save, saving && { opacity: 0.5 }]}>
                {saving ? '...' : '저장'}
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 30 }}>
            <Text style={styles.hint}>
              모임 만들 때 기본으로 들어갈 디자인을 골라요. 모임마다 변경할 수 있어요.
            </Text>
            <CardTemplatePicker value={selected} onChange={setSelected} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  backdrop: { flex: 1 },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  cancel: { fontSize: 15, color: '#999' },
  title: { fontSize: 16, fontWeight: '700', color: '#222' },
  save: { fontSize: 15, fontWeight: '600', color: '#7b2d4e' },

  body: { paddingHorizontal: 20, paddingTop: 12 },
  hint: { fontSize: 12, color: '#888', lineHeight: 18, marginBottom: 8 },
});
