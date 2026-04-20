import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { GatheringType } from '@/lib/types/gathering';

interface Props {
  value: GatheringType;
  onChange: (v: GatheringType) => void;
}

interface Option {
  key: GatheringType;
  title: string;
  subtitle: string;
}

const OPTIONS: Option[] = [
  { key: 'cost_share', title: 'Cost Share',    subtitle: '방장이 와인 준비 · 비용 분담 (블라인드 슬롯 가능)' },
  { key: 'byob',       title: 'BYOB',          subtitle: '각자 자기 셀러에서 한 병 지참' },
  { key: 'donation',   title: 'Host Donation', subtitle: '방장이 전부 제공 · 참가자는 옵션으로 가져올 수 있음' },
];

/** Three-way card selector for the gathering type at create time. */
export function GatheringTypeSelector({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {OPTIONS.map(o => {
        const active = value === o.key;
        return (
          <Pressable
            key={o.key}
            style={[styles.card, active && styles.cardActive]}
            onPress={() => onChange(o.key)}
          >
            <View style={styles.text}>
              <Text style={[styles.title, active && styles.titleActive]}>{o.title}</Text>
              <Text style={styles.subtitle}>{o.subtitle}</Text>
            </View>
            <View style={[styles.radio, active && styles.radioActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa',
  },
  cardActive: { backgroundColor: '#f7f0f3', borderColor: '#7b2d4e' },
  text: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#222' },
  titleActive: { color: '#7b2d4e' },
  subtitle: { fontSize: 11, color: '#999', marginTop: 2 },
  radio: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: '#ccc', backgroundColor: 'transparent',
  },
  radioActive: { borderColor: '#7b2d4e', backgroundColor: '#7b2d4e' },
});
