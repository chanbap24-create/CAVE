import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, Modal, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MyCollectionPickerSheet } from '@/components/MyCollectionPickerSheet';
import type { MyCollectionItem } from '@/lib/hooks/useMyCollectionPicker';
import type { GatheringType } from '@/lib/types/gathering';

interface Props {
  visible: boolean;
  gatheringType: GatheringType;
  onClose: () => void;
  /** Returns true on success so the caller can close the sheet. */
  onSubmit: (message: string, collectionId: number | null) => Promise<boolean>;
}

type PickedWine = {
  id: number;
  name: string;
  vintage_year: number | null;
  image_url: string | null;
  photo_url: string | null;
};

/**
 * Apply-to-join sheet. Behavior by gathering type:
 *
 *  cost_share — wine pick optional. If skipped, applicant will need a
 *               unanimous vote via the no_wine_apply flow (Phase 6).
 *  byob       — wine pick required.
 *  donation   — wine pick optional (host covers); no vote needed to attend.
 */
export function ApplyGatheringSheet({ visible, gatheringType, onClose, onSubmit }: Props) {
  const [message, setMessage] = useState('');
  const [picked, setPicked] = useState<PickedWine | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  function handlePick(item: MyCollectionItem) {
    setPicked({
      id: item.id,
      name: item.wine?.name ?? 'Selected wine',
      vintage_year: item.wine?.vintage_year ?? null,
      image_url: item.wine?.image_url ?? null,
      photo_url: item.photo_url,
    });
    setPickerOpen(false);
  }

  async function handleSubmit() {
    if (gatheringType === 'byob' && picked == null) {
      Alert.alert('', '가져갈 와인을 선택해주세요');
      return;
    }
    setSubmitting(true);
    const ok = await onSubmit(message, picked?.id ?? null);
    setSubmitting(false);
    if (ok) {
      setMessage('');
      setPicked(null);
    }
  }

  const wineRequired = gatheringType === 'byob';
  const wineLabel =
    gatheringType === 'byob' ? '가져갈 와인 *'
    : gatheringType === 'cost_share' ? '내 와인 (선택)'
    : '와인 (선택)';
  const helperText =
    gatheringType === 'byob'
      ? '모든 참가자는 본인이 가져갈 와인을 지정해야 합니다.'
      : gatheringType === 'cost_share'
        ? '와인 없이 신청할 수 있지만, 참가 확정을 위해서는 참가자 전원의 승인이 필요합니다.'
        : '방장이 준비합니다. 원한다면 본인 와인도 가져갈 수 있어요.';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.avoidingWrap}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scroll,
              // Keep the Send Request button above the home indicator.
              { paddingBottom: 20 + Math.max(insets.bottom, 16) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>Apply to Join</Text>
            <Text style={styles.desc}>Send a message to the host</Text>

        <TextInput
          style={styles.messageInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Introduce yourself..."
          placeholderTextColor="#ccc"
          multiline
          maxLength={200}
        />

        <Text style={styles.wineLabel}>{wineLabel}</Text>
        <Text style={styles.helper}>{helperText}</Text>

        {picked ? (
          <View style={styles.pickedRow}>
            {picked.photo_url || picked.image_url ? (
              <Image
                source={picked.photo_url ?? picked.image_url!}
                style={styles.thumb}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.thumb, { backgroundColor: '#f0f0f0' }]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.pickedName} numberOfLines={1}>{picked.name}</Text>
              {picked.vintage_year != null && (
                <Text style={styles.pickedMeta}>{picked.vintage_year}</Text>
              )}
            </View>
            <Pressable onPress={() => setPickerOpen(true)}>
              <Text style={styles.changeText}>Change</Text>
            </Pressable>
            {!wineRequired && (
              <Pressable onPress={() => setPicked(null)}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <Pressable style={styles.pickBtn} onPress={() => setPickerOpen(true)}>
            <Text style={styles.pickBtnText}>
              {wineRequired ? '+ 와인 선택' : '+ 내 셀러에서 와인 선택'}
            </Text>
          </Pressable>
        )}

            <Pressable
              style={[styles.submitBtn, submitting && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitText}>{submitting ? 'Sending...' : 'Send Request'}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <MyCollectionPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePick}
        title="신청에 가져갈 와인"
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  // Full-screen flex container anchored bottom so the keyboard push
  // translates to the sheet sliding up rather than growing downward.
  avoidingWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  // Inner ScrollView lets users see content even when the keyboard push
  // alone isn't enough (small screens, landscape).
  scroll: { padding: 20 },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#ddd', alignSelf: 'center', marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 4 },
  desc: { fontSize: 13, color: '#999', marginBottom: 12 },

  messageInput: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#fafafa',
    height: 80, textAlignVertical: 'top',
  },

  wineLabel: { fontSize: 13, fontWeight: '700', color: '#222', marginTop: 16, marginBottom: 4 },
  helper: { fontSize: 11, color: '#999', marginBottom: 10, lineHeight: 16 },

  pickBtn: {
    borderWidth: 1, borderColor: '#7b2d4e', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  pickBtnText: { fontSize: 13, fontWeight: '600', color: '#7b2d4e' },

  pickedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 10, backgroundColor: '#fafaf8', borderRadius: 10,
  },
  thumb: { width: 40, height: 40, borderRadius: 8 },
  pickedName: { fontSize: 13, fontWeight: '600', color: '#222' },
  pickedMeta: { fontSize: 11, color: '#999', marginTop: 2 },
  changeText: { fontSize: 12, fontWeight: '600', color: '#7b2d4e', paddingHorizontal: 6 },
  removeText: { fontSize: 12, fontWeight: '600', color: '#ed4956', paddingHorizontal: 6 },

  submitBtn: {
    backgroundColor: '#7b2d4e', padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 20,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
