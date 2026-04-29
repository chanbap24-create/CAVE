import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  /** 표시 라벨 (예: 'ABC 와인샵', '소믈리에 김XX'). 없으면 'Partner' */
  label?: string | null;
  /** sm = 인라인용 (이름 옆) / md = 헤더용 (프로필 메인) */
  size?: 'sm' | 'md';
}

/**
 * 파트너 자격 배지. profiles.is_partner=true 인 계정에만 노출.
 * 일반 유저에는 어떤 배지도 붙지 않는다 (사용자 요구).
 *
 * 노출 위치: 프로필 헤더, 컬렉션 디테일 시트 owner 행, 멘션/검색 결과,
 * 모임 호스트 표시 등. 호출 측에서 is_partner 체크 후 렌더.
 */
export function PartnerBadge({ label, size = 'sm' }: Props) {
  const s = size === 'md' ? mdStyles : smStyles;
  return (
    <View style={s.badge}>
      <Text style={s.icon}>✦</Text>
      <Text style={s.label}>{label || 'Partner'}</Text>
    </View>
  );
}

const smStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    backgroundColor: '#231115', alignSelf: 'flex-start',
  },
  icon: { fontSize: 9, color: '#e8c8d4' },
  label: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
});

const mdStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    backgroundColor: '#231115', alignSelf: 'flex-start',
  },
  icon: { fontSize: 11, color: '#e8c8d4' },
  label: { fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 0.4 },
});
