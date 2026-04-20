import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CategoryPicker } from '@/components/CategoryPicker';
import { GatheringTypeSelector } from '@/components/GatheringTypeSelector';
import { HostWineSlots, type HostWineSlot } from '@/components/HostWineSlots';
import { useDrinkCategories } from '@/lib/hooks/useDrinkCategories';
import { formatPickerDate, formatPickerTime } from '@/lib/utils/dateUtils';
import type { GatheringType } from '@/lib/types/gathering';

export interface GatheringFormValue {
  title: string;
  description: string;
  location: string;
  date: Date;
  maxMembers: string;
  price: string;
  category: string | null;
  gatheringType: GatheringType;
  hostWineSlots: HostWineSlot[];
}

export function emptyGatheringForm(): GatheringFormValue {
  return {
    title: '', description: '', location: '',
    date: new Date(), maxMembers: '8', price: '', category: null,
    gatheringType: 'cost_share', hostWineSlots: [],
  };
}

interface Props {
  value: GatheringFormValue;
  onChange: (next: GatheringFormValue) => void;
}

/** All form inputs for a new gathering. Caller owns submit + reset. */
export function GatheringForm({ value, onChange }: Props) {
  const { categories } = useDrinkCategories();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  function set<K extends keyof GatheringFormValue>(key: K, v: GatheringFormValue[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        value={value.title}
        onChangeText={t => set('title', t)}
        placeholder="e.g. Burgundy Blind Tasting"
        placeholderTextColor="#ccc"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        value={value.description}
        onChangeText={t => set('description', t)}
        placeholder="What's this gathering about?"
        placeholderTextColor="#ccc"
        multiline
      />

      <Text style={styles.label}>Type *</Text>
      <GatheringTypeSelector
        value={value.gatheringType ?? 'cost_share'}
        onChange={v => set('gatheringType', v)}
      />

      {((value.gatheringType ?? 'cost_share') === 'cost_share' || value.gatheringType === 'donation') && (
        <>
          <Text style={styles.label}>
            {(value.gatheringType ?? 'cost_share') === 'cost_share' ? '준비할 와인 *' : '준비할 와인 (optional)'}
          </Text>
          <HostWineSlots
            slots={value.hostWineSlots ?? []}
            onChange={s => set('hostWineSlots', s)}
            requireAtLeastOne={(value.gatheringType ?? 'cost_share') === 'cost_share'}
          />
        </>
      )}

      <Text style={styles.label}>Category (optional)</Text>
      <CategoryPicker
        categories={categories}
        selected={value.category}
        onChange={k => set('category', k)}
      />

      <Text style={styles.label}>Location *</Text>
      <TextInput
        style={styles.input}
        value={value.location}
        onChangeText={t => set('location', t)}
        placeholder="e.g. Le Bar, Cheongdam"
        placeholderTextColor="#ccc"
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Date *</Text>
          <Pressable style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.pickerText}>{formatPickerDate(value.date)}</Text>
          </Pressable>
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Time</Text>
          <Pressable style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.pickerText}>{formatPickerTime(value.date)}</Text>
          </Pressable>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={value.date}
          mode="date"
          display="spinner"
          minimumDate={new Date()}
          onChange={(_, selected) => {
            setShowDatePicker(false);
            if (selected) {
              const d = new Date(value.date);
              d.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
              set('date', d);
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={value.date}
          mode="time"
          display="spinner"
          minuteInterval={15}
          onChange={(_, selected) => {
            setShowTimePicker(false);
            if (selected) {
              const d = new Date(value.date);
              d.setHours(selected.getHours(), selected.getMinutes());
              set('date', d);
            }
          }}
        />
      )}

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Max Members</Text>
          <TextInput
            style={styles.input}
            value={value.maxMembers}
            onChangeText={t => set('maxMembers', t)}
            placeholder="8"
            placeholderTextColor="#ccc"
            keyboardType="number-pad"
          />
        </View>
        {value.gatheringType === 'cost_share' && (
          <View style={styles.half}>
            <Text style={styles.label}>Price (won)</Text>
            <TextInput
              style={styles.input}
              value={value.price}
              onChangeText={t => set('price', t)}
              placeholder="Per person"
              placeholderTextColor="#ccc"
              keyboardType="number-pad"
            />
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: { padding: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 6, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#fafafa',
  },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  pickerBtn: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, backgroundColor: '#fafafa',
  },
  pickerText: { fontSize: 15, color: '#222' },
});
