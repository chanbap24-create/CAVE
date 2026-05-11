import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import {
  TASTE_AXES, TASTE_CHIPS,
  type TasteAxisKey, type TasteProfileValue, isTasteProfileEmpty,
} from '@/lib/constants/tasteProfile';

interface Props {
  value: TasteProfileValue;
  /** Edit mode → onChange 제공. Read mode → undefined. */
  onChange?: (next: TasteProfileValue) => void;
}

/**
 * Vivino식 테이스팅 프로파일 — 3-axis 슬라이더 + 향 칩.
 *
 * Edit mode (onChange 제공): 모든 축/칩 노출, 탭으로 입력.
 * Read mode (onChange undefined): 입력된 항목만 시각화. 비어있으면 null 리턴.
 *
 * TastingNoteEditor 안에 흡수되어 별점/노트/프로파일이 한 흐름.
 */
export function TasteProfile({ value, onChange }: Props) {
  const editable = !!onChange;

  // Read mode 에서 아무것도 입력 안 됐으면 섹션 자체 숨김.
  if (!editable && isTasteProfileEmpty(value)) return null;

  function setAxis(key: TasteAxisKey, n: number | null) {
    onChange?.({ ...value, [key]: n });
  }

  function toggleTag(key: string) {
    const next = value.tags.includes(key)
      ? value.tags.filter(t => t !== key)
      : [...value.tags, key];
    onChange?.({ ...value, tags: next });
  }

  return (
    <View style={styles.wrap}>
      {TASTE_AXES.map(axis => {
        const v = value[axis.key];
        // Read mode 에선 입력 안 된 축은 숨김.
        if (!editable && v == null) return null;
        return (
          <TasteAxisRow
            key={axis.key}
            left={axis.leftLabel}
            right={axis.rightLabel}
            value={v}
            onChange={editable ? (n) => setAxis(axis.key, n) : undefined}
          />
        );
      })}

      <TasteChipRow
        selected={value.tags}
        onToggle={editable ? toggleTag : undefined}
      />
    </View>
  );
}

interface AxisProps {
  left: string;
  right: string;
  value: number | null;
  onChange?: (n: number | null) => void;
}

/** 5단계 점 트랙. 같은 점 다시 탭하면 해제 (edit mode 에서). */
function TasteAxisRow({ left, right, value, onChange }: AxisProps) {
  const editable = !!onChange;
  return (
    <View style={styles.axisRow}>
      <Text style={styles.axisLabel}>{left}</Text>
      <View style={styles.track}>
        <View style={styles.trackLine} />
        {[1, 2, 3, 4, 5].map(n => {
          const active = value === n;
          return (
            <Pressable
              key={n}
              style={styles.dotHit}
              onPress={() => onChange?.(active ? null : n)}
              disabled={!editable}
              hitSlop={6}
            >
              <View style={[styles.dot, active && styles.dotActive]} />
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.axisLabel}>{right}</Text>
    </View>
  );
}

interface ChipRowProps {
  selected: string[];
  onToggle?: (key: string) => void;
}

function TasteChipRow({ selected, onToggle }: ChipRowProps) {
  const editable = !!onToggle;
  // Read mode 면 선택된 것만, edit mode 면 전체.
  const visible = editable ? TASTE_CHIPS : TASTE_CHIPS.filter(c => selected.includes(c.key));
  if (visible.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {visible.map(chip => {
        const isSelected = selected.includes(chip.key);
        return (
          <Pressable
            key={chip.key}
            style={[
              styles.chip,
              isSelected && { backgroundColor: chip.bg, borderColor: chip.bg },
            ]}
            onPress={() => onToggle?.(chip.key)}
            disabled={!editable}
          >
            <Text style={styles.chipEmoji}>{chip.emoji}</Text>
            <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const TRACK_DOT = 10;
const TRACK_DOT_ACTIVE = 14;

const styles = StyleSheet.create({
  wrap: { gap: 10, marginBottom: 12 },

  axisRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  axisLabel: { fontSize: 11, color: '#999', width: 44 },
  track: { flex: 1, flexDirection: 'row', height: 22, alignItems: 'center' },
  trackLine: {
    position: 'absolute', left: 0, right: 0, height: 2,
    backgroundColor: '#eee', borderRadius: 1,
  },
  dotHit: {
    flex: 1, alignItems: 'center', justifyContent: 'center', height: 22,
  },
  dot: {
    width: TRACK_DOT, height: TRACK_DOT, borderRadius: TRACK_DOT / 2,
    backgroundColor: '#ddd',
  },
  dotActive: {
    width: TRACK_DOT_ACTIVE, height: TRACK_DOT_ACTIVE, borderRadius: TRACK_DOT_ACTIVE / 2,
    backgroundColor: '#7b2d4e',
  },

  chipRow: { gap: 6, paddingVertical: 4, paddingRight: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 14, borderWidth: 1, borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  chipEmoji: { fontSize: 13 },
  chipLabel: { fontSize: 12, color: '#444', fontWeight: '500' },
  chipLabelSelected: { color: '#fff', fontWeight: '600' },
});
