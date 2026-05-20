import React from 'react';
import { View, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { CardImage } from '@/components/CardImage';
import { Body, BodyBold, Caption } from '@/components/Typography';
import { Button } from '@/components/Button';
import { colors, spacing, borderRadius, shadow, fontFamily } from '@/constants/theme';

interface Props {
  imageUrl?: string;
  title: string;
  /** 정가 (할인 전) — 정가가 있으면 자동으로 strikethrough + 할인% 표시 */
  originalPrice?: number;
  price: number;
  /** 작은 메타 chip 들 ("매장", "포장" 등) */
  meta?: string[];
  /** 만료 / 부가 정보 */
  expiry?: string;
  /** CTA 라벨 (기본: "구매하기") */
  ctaLabel?: string;
  ctaVariant?: 'primary' | 'pill';   // primary = 코랄, pill = 옐로우
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Promo / 쿠폰 카드 — 파파이스 쿠폰 톤.
 *
 * 구성:
 *   상단: 제목 + 정가→할인가 + N% 할인 (빨강 강조)
 *   우측: product 이미지
 *   중단: meta chips + 만료일
 *   하단: 풀폭 CTA 버튼 (옐로우 또는 코랄)
 */
export function PromoCard({
  imageUrl, title, originalPrice, price, meta = [], expiry, ctaLabel = '구매하기', ctaVariant = 'pill', onPress, style,
}: Props) {
  const discountPct = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.body}>
        <View style={{ flex: 1, gap: 6 }}>
          <BodyBold numberOfLines={2} style={styles.title}>{title}</BodyBold>
          {originalPrice ? (
            <Body style={styles.originalLine}>
              <Body style={styles.originalPrice}>{originalPrice.toLocaleString('ko-KR')}원</Body>
              {'  →  '}
              <Body style={styles.price}>{price.toLocaleString('ko-KR')}원</Body>
            </Body>
          ) : (
            <BodyBold style={styles.priceOnly}>{price.toLocaleString('ko-KR')}원</BodyBold>
          )}
          {discountPct != null ? (
            <BodyBold style={styles.discountText}>{discountPct}% 할인</BodyBold>
          ) : null}
          {meta.length > 0 ? (
            <View style={styles.metaRow}>
              {meta.map((m, i) => (
                <View key={i} style={styles.metaChip}><Caption tone="muted">{m}</Caption></View>
              ))}
            </View>
          ) : null}
        </View>
        {imageUrl ? (
          <CardImage source={imageUrl} style={styles.image} contentFit="contain" />
        ) : null}
      </View>

      {expiry ? <Caption tone="muted" style={styles.expiry}>{expiry}</Caption> : null}

      <Button label={ctaLabel} variant={ctaVariant} size="lg" fullWidth onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.base,
    ...shadow.soft,
  },
  body: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  title: { fontSize: 16, lineHeight: 22, letterSpacing: -0.3 },
  originalLine: { fontSize: 14 },
  originalPrice: { textDecorationLine: 'line-through', color: colors.textMuted },
  price: { fontFamily: fontFamily.bold, color: colors.text, fontSize: 16 },
  priceOnly: { fontSize: 18, color: colors.text },
  discountText: { fontSize: 18, color: colors.primary, fontFamily: fontFamily.extrabold },
  metaRow: { flexDirection: 'row', gap: 6, marginTop: spacing.xs, flexWrap: 'wrap' },
  metaChip: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  image: { width: 80, height: 80 },
  expiry: { textAlign: 'right' },
});
