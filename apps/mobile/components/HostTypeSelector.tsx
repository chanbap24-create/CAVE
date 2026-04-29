import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { GatheringHostType } from '@/lib/hooks/useGatherings';

interface Props {
  value: GatheringHostType;
  onChange: (v: GatheringHostType) => void;
  /** 파트너 라벨이 있을 때 셀렉터 위에 노출 */
  partnerLabel?: string | null;
}

const OPTIONS: { value: GatheringHostType; label: string; desc: string }[] = [
  { value: 'user', label: '일반', desc: '내 개인 모임' },
  { value: 'shop', label: '샵 직영', desc: '운영 중인 샵 명의' },
  { value: 'sommelier', label: '소믈리에', desc: '내 큐레이션' },
  { value: 'venue', label: '업장', desc: '업장 명의 이벤트' },
];

/**
 * 파트너(is_partner=true) 사용자만 사용. 일반 사용자에겐 GatheringForm 이
 * 이 컴포넌트를 렌더하지 않음. DB trigger(enforce_partner_host_type) 가
 * 권한을 다시 한 번 강제하므로 우회 불가.
 */
export function HostTypeSelector({ value, onChange, partnerLabel }: Props) {
  return (
    <View>
      {partnerLabel ? (
        <Text style={styles.partnerLabel}>파트너 계정: {partnerLabel}</Text>
      ) : null}
      <View style={styles.row}>
        {OPTIONS.map(opt => {
          const active = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              style={[styles.opt, active && styles.optActive]}
              onPress={() => onChange(opt.value)}
            >
              <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
              <Text style={[styles.desc, active && styles.descActive]}>{opt.desc}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  partnerLabel: {
    fontSize: 11, fontWeight: '600', color: '#7b2d4e', marginBottom: 6,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: {
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1, borderColor: '#eee',
    backgroundColor: '#fff', minWidth: 100,
  },
  optActive: { borderColor: '#7b2d4e', backgroundColor: '#fdf6f8' },
  label: { fontSize: 13, fontWeight: '600', color: '#222' },
  labelActive: { color: '#7b2d4e' },
  desc: { fontSize: 11, color: '#999', marginTop: 2 },
  descActive: { color: '#9c5b73' },
});
