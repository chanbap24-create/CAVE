import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { CategoryPicker } from '@/components/CategoryPicker';
import { GatheringTypeSelector } from '@/components/GatheringTypeSelector';
import { HostTypeSelector } from '@/components/HostTypeSelector';
import { GatheringDateTimeRow } from '@/components/GatheringDateTimeRow';
import { HostWineSlots, type HostWineSlot } from '@/components/HostWineSlots';
import { useDrinkCategories } from '@/lib/hooks/useDrinkCategories';
import { useIsPartner } from '@/lib/hooks/useIsPartner';
import type { GatheringType } from '@/lib/types/gathering';
import type { GatheringHostType } from '@/lib/hooks/useGatherings';

export interface GatheringFormValue {
  title: string;
  description: string;
  location: string;
  date: Date;
  maxMembers: string;
  price: string;
  category: string | null;
  gatheringType: GatheringType;
  /** 파트너만 'user' 외 값 사용 가능 (DB trigger 강제) */
  hostType: GatheringHostType;
  hostWineSlots: HostWineSlot[];
}

export function emptyGatheringForm(): GatheringFormValue {
  return {
    title: '', description: '', location: '',
    date: new Date(), maxMembers: '8', price: '', category: null,
    gatheringType: 'cost_share', hostType: 'user', hostWineSlots: [],
  };
}

// Context-aware label for the host wine slot section. All three types allow
// host-committed wines, but what the slots mean differs — labels should
// reflect the user's mental model instead of being identical everywhere.
function gatheringTypeWineLabel(type: GatheringType): string {
  if (type === 'cost_share') return '준비할 와인 * (블라인드 가능)';
  if (type === 'byob') return '내가 가져갈 와인 *';
  return '제공할 와인 (optional, 블라인드 가능)';
}

interface Props {
  value: GatheringFormValue;
  onChange: (next: GatheringFormValue) => void;
  /** Optional submit button rendered at the end of the form. Makes the
   *  create action reachable without scrolling back up to the sheet header,
   *  which users were missing on long forms. */
  onSubmit?: () => void;
  submitting?: boolean;
  submitLabel?: string;
}

/** All form inputs for a new gathering. Caller owns submit + reset. */
export function GatheringForm({ value, onChange, onSubmit, submitting, submitLabel = 'Create Gathering' }: Props) {
  const { categories } = useDrinkCategories();
  const { isPartner, partnerLabel } = useIsPartner();

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

      {isPartner && (
        <>
          <Text style={styles.label}>Host (파트너 전용)</Text>
          <HostTypeSelector
            value={value.hostType}
            onChange={v => set('hostType', v)}
            partnerLabel={partnerLabel}
          />
        </>
      )}

      <Text style={styles.label}>Type *</Text>
      <GatheringTypeSelector
        value={value.gatheringType ?? 'cost_share'}
        onChange={v => set('gatheringType', v)}
      />

      <Text style={styles.label}>
        {gatheringTypeWineLabel(value.gatheringType ?? 'cost_share')}
      </Text>
      <HostWineSlots
        slots={value.hostWineSlots ?? []}
        onChange={s => set('hostWineSlots', s)}
        requireAtLeastOne={(value.gatheringType ?? 'cost_share') !== 'donation'}
        allowBlind={(value.gatheringType ?? 'cost_share') !== 'byob'}
      />

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

      <GatheringDateTimeRow date={value.date} onChange={d => set('date', d)} />

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

      {onSubmit && (
        <Pressable
          style={[styles.submit, submitting && { opacity: 0.5 }]}
          onPress={onSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>{submitting ? '...' : submitLabel}</Text>
        </Pressable>
      )}

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

  submit: {
    marginTop: 24, backgroundColor: '#7b2d4e',
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
