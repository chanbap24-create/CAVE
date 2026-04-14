import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCreateGathering } from '@/lib/hooks/useCreateGathering';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${y}.${m}.${d} (${days[date.getDay()]})`;
}

function formatTime(date: Date) {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function CreateGatheringSheet({ visible, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [maxMembers, setMaxMembers] = useState('8');
  const [price, setPrice] = useState('');
  const [creating, setCreating] = useState(false);

  const { createGathering } = useCreateGathering(() => {
    onCreated();
    resetForm();
    onClose();
  });

  function resetForm() {
    setTitle(''); setDescription(''); setLocation('');
    setDate(new Date()); setMaxMembers('8'); setPrice('');
  }

  async function handleCreate() {
    setCreating(true);
    await createGathering({
      title,
      description,
      location,
      gatheringDate: date,
      maxMembers: parseInt(maxMembers) || 8,
      pricePerPerson: price ? parseInt(price) : null,
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

          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Burgundy Blind Tasting"
              placeholderTextColor="#ccc"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="What's this gathering about?"
              placeholderTextColor="#ccc"
              multiline
            />

            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Le Bar, Cheongdam"
              placeholderTextColor="#ccc"
            />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Date *</Text>
                <Pressable style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.pickerText}>{formatDate(date)}</Text>
                </Pressable>
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Time</Text>
                <Pressable style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.pickerText}>{formatTime(date)}</Text>
                </Pressable>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                onChange={(_, selected) => {
                  setShowDatePicker(false);
                  if (selected) {
                    const newDate = new Date(date);
                    newDate.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                    setDate(newDate);
                  }
                }}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={date}
                mode="time"
                display="spinner"
                minuteInterval={15}
                onChange={(_, selected) => {
                  setShowTimePicker(false);
                  if (selected) {
                    const newDate = new Date(date);
                    newDate.setHours(selected.getHours(), selected.getMinutes());
                    setDate(newDate);
                  }
                }}
              />
            )}

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Max Members</Text>
                <TextInput
                  style={styles.input}
                  value={maxMembers}
                  onChangeText={setMaxMembers}
                  placeholder="8"
                  placeholderTextColor="#ccc"
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Price (won)</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="Optional"
                  placeholderTextColor="#ccc"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
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

  form: { padding: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 6, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#fafafa',
  },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  pickerBtn: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, backgroundColor: '#fafafa',
  },
  pickerText: { fontSize: 15, color: '#222' },
});
