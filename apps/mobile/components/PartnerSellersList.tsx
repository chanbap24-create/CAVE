import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { PartnerBadge } from '@/components/PartnerBadge';
import type { WineSeller } from '@/lib/hooks/usePartnerSellersForWine';

interface Props {
  sellers: WineSeller[];
}

/**
 * 카탈로그 페이지의 "판매처" 섹션 — read-only.
 * 판매처 0개면 섹션 자체 숨김.
 */
export function PartnerSellersList({ sellers }: Props) {
  const router = useRouter();
  if (sellers.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>판매처 ({sellers.length})</Text>
      {sellers.map(s => (
        <Pressable
          key={s.id}
          style={styles.row}
          onPress={() => s.partner && router.push(`/user/${s.partner.id}`)}
        >
          {s.partner?.avatar_url ? (
            <Image source={s.partner.avatar_url} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )}
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {s.partner?.partner_label || s.partner?.display_name || s.partner?.username || '파트너'}
              </Text>
              <PartnerBadge />
            </View>
          </View>
          <Text style={styles.price}>{s.price.toLocaleString('ko-KR')}원</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  heading: {
    fontSize: 13, fontWeight: '700', color: '#222',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: { backgroundColor: '#e0e0e0' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 13, fontWeight: '600', color: '#222' },
  price: { fontSize: 14, fontWeight: '700', color: '#7b2d4e' },
});
