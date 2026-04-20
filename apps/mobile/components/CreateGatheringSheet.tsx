import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useCreateGathering } from '@/lib/hooks/useCreateGathering';
import { GatheringForm, emptyGatheringForm, type GatheringFormValue } from '@/components/GatheringForm';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateGatheringSheet({ visible, onClose, onCreated }: Props) {
  const [form, setForm] = useState<GatheringFormValue>(emptyGatheringForm());
  const [creating, setCreating] = useState(false);

  const { createGathering } = useCreateGathering(() => {
    onCreated();
    setForm(emptyGatheringForm());
    onClose();
  });

  async function handleCreate() {
    setCreating(true);
    await createGathering({
      title: form.title,
      description: form.description,
      location: form.location,
      gatheringDate: form.date,
      maxMembers: parseInt(form.maxMembers) || 8,
      pricePerPerson: form.price ? parseInt(form.price) : null,
      category: form.category,
      gatheringType: form.gatheringType,
      hostSlots: form.hostWineSlots.map(s => ({
        collection_id: s.collectionId,
        is_blind: s.isBlind,
      })),
    });
    setCreating(false);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Pressable onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.sheetTitle}>New Gathering</Text>
            <Pressable onPress={handleCreate} disabled={creating}>
              <Text style={[styles.createText, creating && { opacity: 0.5 }]}>
                {creating ? '...' : 'Create'}
              </Text>
            </Pressable>
          </View>

          <GatheringForm value={form} onChange={setForm} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  cancelText: { fontSize: 15, color: '#999' },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  createText: { fontSize: 15, fontWeight: '600', color: '#7b2d4e' },
});
