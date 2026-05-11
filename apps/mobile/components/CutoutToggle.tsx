import React from 'react';
import { View, Text, Switch, ActivityIndicator, StyleSheet } from 'react-native';
import type { CutoutState } from '@/lib/hooks/useCutoutImage';

interface Props {
  state: CutoutState;
  /** Whether the current card layout supports cutout (false for 'cover'). */
  layoutAllows: boolean;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

/**
 * Toggle row that shows up beneath the cover image picker. Visibility and
 * disabled-state are driven entirely by props — no business logic here.
 *
 * Hidden cases (returns null):
 *  - state.kind === 'empty' (no image picked yet)
 *  - state.kind === 'unsupported' (device or this specific image)
 */
export function CutoutToggle({ state, layoutAllows, enabled, onChange }: Props) {
  if (state.kind === 'empty' || state.kind === 'unsupported') return null;

  const processing = state.kind === 'processing';
  // When the layout is 'cover', cutout makes the background empty — disable
  // and show why instead of letting the user toggle into a broken preview.
  const disabled = processing || !layoutAllows;
  const hint = !layoutAllows
    ? '현재 카드 디자인은 배경 사진을 그대로 써요'
    : processing
      ? '배경 분석 중...'
      : '원본 ↔ 누끼 비교';

  return (
    <View style={styles.row}>
      <View style={styles.labelCol}>
        <Text style={styles.title}>배경 자동 제거</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      {processing ? (
        <ActivityIndicator size="small" color="#7b2d4e" />
      ) : (
        <Switch
          value={enabled && layoutAllows}
          onValueChange={onChange}
          disabled={disabled}
          trackColor={{ true: '#7b2d4e', false: '#ddd' }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10, paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: '#fafafa', borderRadius: 10, borderWidth: 1, borderColor: '#eee',
  },
  labelCol: { flex: 1, paddingRight: 12 },
  title: { fontSize: 13, fontWeight: '600', color: '#222' },
  hint: { fontSize: 11, color: '#999', marginTop: 2 },
});
