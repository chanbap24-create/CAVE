import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CardImage } from '@/components/CardImage';
import { PartnerBadge } from '@/components/PartnerBadge';
import { Body, BodyBold, Caption, Eyebrow } from '@/components/Typography';
import { Button } from '@/components/Button';
import { colors, spacing, borderRadius, fontFamily } from '@/constants/theme';
import type { WineSeller } from '@/lib/hooks/usePartnerSellersForWine';

interface Props {
  sellers: WineSeller[];
}

/**
 * 카탈로그 페이지의 "판매처" 섹션. 행 우측 "구매" 버튼 → /order/new?menuId=N.
 * 판매처 0개면 섹션 숨김.
 */
export function PartnerSellersList({ sellers }: Props) {
  const router = useRouter();
  if (sellers.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Eyebrow tone="muted" style={styles.heading}>SELLERS · {sellers.length}</Eyebrow>
      {sellers.map(s => (
        <View key={s.id} style={styles.row}>
          <Pressable
            style={styles.left}
            onPress={() => s.partner && router.push(`/user/${s.partner.id}`)}
          >
            {s.partner?.avatar_url ? (
              <CardImage source={s.partner.avatar_url} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <BodyBold numberOfLines={1}>
                  {s.partner?.partner_label || s.partner?.display_name || s.partner?.username || '파트너'}
                </BodyBold>
                <PartnerBadge />
              </View>
            </View>
          </Pressable>
          <Button
            label="구매"
            variant="pill"
            size="sm"
            onPress={() => router.push({ pathname: '/order/new', params: { menuId: String(s.id) } } as any)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  heading: { letterSpacing: 1.5, marginBottom: spacing.base },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.base,
    paddingVertical: spacing.sm,
  },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 36, height: 36, borderRadius: borderRadius.full },
  avatarPlaceholder: { backgroundColor: colors.surfaceLight },
  info: { flex: 1, gap: spacing.xs, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  buyBtn: {
    paddingHorizontal: spacing.base, paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  buyBtnText: { color: '#fff', fontFamily: fontFamily.semibold },
});
