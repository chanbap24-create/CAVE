import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, Modal, StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { MyCollectionPickerSheet } from '@/components/MyCollectionPickerSheet';
import type { MyCollectionItem } from '@/lib/hooks/useMyCollectionPicker';

interface Props {
  visible: boolean;
  /** Collection id currently on the contribution — hidden from the picker. */
  currentCollectionId: number | null;
  onClose: () => void;
  onSubmit: (newCollectionId: number, note: string) => Promise<boolean>;
}

/**
 * Two-step sheet: step 1 pick a replacement wine, step 2 confirm with an
 * optional note, then a submit fires the approval request. The submission
 * triggers a unanimous-vote cycle handled by useGatheringApprovals.
 */
export function ChangeWineRequestSheet({ visible, currentCollectionId, onClose, onSubmit }: Props) {
  const [picked, setPicked] = useState<MyCollectionItem | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setPicked(null);
    setNote('');
    setPickerOpen(false);
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!picked) return;
    setSubmitting(true);
    const ok = await onSubmit(picked.id, note);
    setSubmitting(false);
    if (ok) { reset(); onClose(); }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>와인 변경 요청</Text>
        <Text style={styles.desc}>
          방장과 참가자 전원의 승인이 필요합니다.
        </Text>

        {picked ? (
          <View style={styles.pickedRow}>
            {picked.photo_url || picked.wine?.image_url ? (
              <Image
                source={picked.photo_url ?? picked.wine!.image_url!}
                style={styles.thumb}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.thumb, styles.placeholder]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.pickedName} numberOfLines={2}>
                {picked.wine?.name ?? 'Selected wine'}
              </Text>
              {picked.wine?.vintage_year != null && (
                <Text style={styles.pickedMeta}>{picked.wine.vintage_year}</Text>
              )}
            </View>
            <Pressable onPress={() => setPickerOpen(true)}>
              <Text style={styles.changeText}>Change</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.pickBtn} onPress={() => setPickerOpen(true)}>
            <Text style={styles.pickBtnText}>+ 내 셀러에서 선택</Text>
          </Pressable>
        )}

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="변경 사유를 적어주세요"
          placeholderTextColor="#ccc"
          multiline
          maxLength={200}
        />

        <Pressable
          style={[styles.submitBtn, (!picked || submitting) && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={!picked || submitting}
        >
          <Text style={styles.submitText}>{submitting ? 'Sending...' : '변경 요청'}</Text>
        </Pressable>
      </View>

      <MyCollectionPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(item) => { setPicked(item); setPickerOpen(false); }}
        excludeIds={currentCollectionId != null ? [currentCollectionId] : []}
        title="변경할 와인"
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#ddd', alignSelf: 'center', marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 4 },
  desc: { fontSize: 12, color: '#999', marginBottom: 14 },

  pickBtn: {
    borderWidth: 1, borderColor: '#7b2d4e', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  pickBtnText: { fontSize: 13, fontWeight: '600', color: '#7b2d4e' },

  pickedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 10, backgroundColor: '#fafaf8', borderRadius: 10,
  },
  thumb: { width: 40, height: 40, borderRadius: 8 },
  placeholder: { backgroundColor: '#f0f0f0' },
  pickedName: { fontSize: 13, fontWeight: '600', color: '#222' },
  pickedMeta: { fontSize: 11, color: '#999', marginTop: 2 },
  changeText: { fontSize: 12, fontWeight: '600', color: '#7b2d4e', paddingHorizontal: 6 },

  label: { fontSize: 12, fontWeight: '700', color: '#222', marginTop: 18, marginBottom: 6 },
  noteInput: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, fontSize: 14, backgroundColor: '#fafafa',
    height: 70, textAlignVertical: 'top',
  },

  submitBtn: {
    backgroundColor: '#7b2d4e', padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 16,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
