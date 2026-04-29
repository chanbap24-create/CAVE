import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CollectionSource } from '@/lib/hooks/useCellarActivity';

interface Props {
  source?: CollectionSource | null;
}

/**
 * 컬렉션 항목의 진정성(authenticity) 신호 배지.
 *
 * v1: collection_source 만으로 1개 배지 노출.
 * v2 이후: 모임 참석 / 테이스팅 노트 / 사진 메타 / 시간 패턴 등 다층 신호로 확장.
 *
 * docs/icave_concept_updates.md §6 참조.
 */
export function AuthenticityBadges({ source }: Props) {
  const meta = sourceMeta(source);
  if (!meta) return null;
  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
        <Text style={styles.icon}>{meta.icon}</Text>
        <Text style={[styles.label, { color: meta.fg }]}>{meta.label}</Text>
      </View>
    </View>
  );
}

function sourceMeta(s?: CollectionSource | null) {
  switch (s) {
    case 'shop_purchase':
      // 가장 강한 신호 (★★★★) — 영수증/스마트오더 검증
      return { icon: '🛒', label: '샵 구매', fg: '#1c5d2e', bg: '#e6f3eb', border: '#bcdcc6' };
    case 'gift':
      return { icon: '🎁', label: '선물 받음', fg: '#8b5e0a', bg: '#fdf3dc', border: '#eed8a3' };
    case 'photo':
      return { icon: '📸', label: '라벨 스캔', fg: '#7b2d4e', bg: '#fdf6f8', border: '#f0d8e0' };
    case 'search':
      return { icon: '🔍', label: '검색 등록', fg: '#444', bg: '#f4f4f5', border: '#e0e0e2' };
    case 'manual':
    default:
      // manual 은 가장 약한 신호 — 따로 표시 안 함 (잡음 줄이기)
      return null;
  }
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    borderWidth: 1,
  },
  icon: { fontSize: 11 },
  label: { fontSize: 11, fontWeight: '600' },
});
