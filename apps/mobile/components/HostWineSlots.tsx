import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MyCollectionPickerSheet } from '@/components/MyCollectionPickerSheet';
import type { MyCollectionItem } from '@/lib/hooks/useMyCollectionPicker';

export interface HostWineSlot {
  /** Collection id from the user's cellar, or null for a blind slot. */
  collectionId: number | null;
  isBlind: boolean;
  /** Cached display info (not sent to server — joins do that). */
  preview?: {
    name: string;
    image_url: string | null;
    photo_url: string | null;
    vintage_year: number | null;
  };
}

interface Props {
  slots: HostWineSlot[];
  onChange: (slots: HostWineSlot[]) => void;
  /** Required (cost_share) vs optional (donation). Min slots is enforced
   *  by the caller via validation — this component just renders. */
  requireAtLeastOne?: boolean;
}

/**
 * Host-side wine slot list for gathering creation.
 *
 * cost_share: host MUST commit at least one slot (enforced by caller).
 * donation:   optional, 0+ slots.
 *
 * Each slot is either a specific bottle (picked from the host's cellar)
 * or a blind placeholder (host reveals manually on gathering day).
 */
export function HostWineSlots({ slots, onChange, requireAtLeastOne }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function pickForSlot(index: number | null) {
    setEditingIndex(index);
    setPickerOpen(true);
  }

  function handlePick(item: MyCollectionItem) {
    const slot: HostWineSlot = {
      collectionId: item.id,
      isBlind: false,
      preview: {
        name: item.wine?.name ?? 'Unknown',
        image_url: item.wine?.image_url ?? null,
        photo_url: item.photo_url,
        vintage_year: item.wine?.vintage_year ?? null,
      },
    };
    if (editingIndex !== null) {
      const next = [...slots];
      next[editingIndex] = slot;
      onChange(next);
    } else {
      onChange([...slots, slot]);
    }
    setPickerOpen(false);
    setEditingIndex(null);
  }

  function addBlind() {
    onChange([...slots, { collectionId: null, isBlind: true }]);
  }

  function remove(index: number) {
    onChange(slots.filter((_, i) => i !== index));
  }

  const excludeIds = slots
    .filter(s => s.collectionId !== null)
    .map(s => s.collectionId as number);

  return (
    <View>
      {slots.map((slot, i) => (
        <View key={i} style={styles.slot}>
          {slot.isBlind ? (
            <View style={[styles.thumb, styles.blindThumb]}>
              <Text style={styles.blindLock}>🔒</Text>
            </View>
          ) : slot.preview?.photo_url || slot.preview?.image_url ? (
            <Image
              source={slot.preview.photo_url ?? slot.preview.image_url!}
              style={styles.thumb}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.thumb, { backgroundColor: '#f0f0f0' }]} />
          )}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {slot.isBlind ? 'Blind Wine' : slot.preview?.name ?? 'Picked wine'}
            </Text>
            <Text style={styles.meta}>
              {slot.isBlind
                ? '당일 공개'
                : slot.preview?.vintage_year
                  ? `${slot.preview.vintage_year}`
                  : ''}
            </Text>
          </View>
          {!slot.isBlind && (
            <Pressable onPress={() => pickForSlot(i)}>
              <Text style={styles.action}>Change</Text>
            </Pressable>
          )}
          <Pressable onPress={() => remove(i)}>
            <Text style={styles.actionDanger}>Remove</Text>
          </Pressable>
        </View>
      ))}

      <View style={styles.addRow}>
        <Pressable style={styles.addBtn} onPress={() => pickForSlot(null)}>
          <Text style={styles.addBtnText}>+ Add wine</Text>
        </Pressable>
        <Pressable style={[styles.addBtn, styles.addBtnAlt]} onPress={addBlind}>
          <Text style={[styles.addBtnText, { color: '#8a6d3b' }]}>+ Blind slot 🔒</Text>
        </Pressable>
      </View>

      {requireAtLeastOne && slots.length === 0 && (
        <Text style={styles.required}>* 최소 한 병은 선택해야 합니다</Text>
      )}

      <MyCollectionPickerSheet
        visible={pickerOpen}
        onClose={() => { setPickerOpen(false); setEditingIndex(null); }}
        onPick={handlePick}
        excludeIds={excludeIds}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  thumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#f0f0f0' },
  blindThumb: {
    backgroundColor: '#f5f0e8', alignItems: 'center', justifyContent: 'center',
  },
  blindLock: { fontSize: 18 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: '#222' },
  meta: { fontSize: 11, color: '#999', marginTop: 2 },
  action: { fontSize: 12, color: '#7b2d4e', fontWeight: '600', paddingHorizontal: 6 },
  actionDanger: { fontSize: 12, color: '#ed4956', fontWeight: '600', paddingHorizontal: 6 },

  addRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  addBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#7b2d4e', alignItems: 'center',
  },
  addBtnAlt: { borderColor: '#8a6d3b' },
  addBtnText: { fontSize: 13, fontWeight: '600', color: '#7b2d4e' },

  required: { fontSize: 11, color: '#ed4956', marginTop: 8 },
});
