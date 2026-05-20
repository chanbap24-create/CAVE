import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { BodyBold, Caption } from '@/components/Typography';
import { CardImage } from '@/components/CardImage';
import { colors, spacing, borderRadius, shadow, fontFamily } from '@/constants/theme';

interface Props {
  /** 큰 타이틀 (예: "오늘의 한 잔"). 영문 + 한글 혼합 OK. */
  title: string;
  /** 부제 — 작은 회색 톤 */
  subtitle?: string;
  /** 우측 product 이미지 (선택, wine/배너) */
  imageUrl?: string;
  /** 배경 톤 */
  tone?: 'coral' | 'peach' | 'gold';
  /** 탭하면 이동 */
  onPress?: () => void;
  href?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * 풀폭 hero banner — 파파이스/배민식 첫인상. 풀 컬러 bg + 큰 흰/검정 헤드라인 + 우측 product 이미지.
 *
 *   coral : primary 코랄 + 흰 텍스트  (가장 강조)
 *   peach : 피치 크림 + 와인 브라운    (부드러움)
 *   gold  : 옐로우 + 와인 브라운       (이벤트 / promo)
 */
export function HeroBanner({ title, subtitle, imageUrl, tone = 'coral', onPress, href, style }: Props) {
  const router = useRouter();
  const t = toneStyle[tone];

  const handlePress = () => {
    if (onPress) onPress();
    else if (href) router.push(href as any);
  };

  const content = (
    <View style={[styles.container, { backgroundColor: t.bg }, style]}>
      <View style={styles.textCol}>
        {subtitle ? <Caption style={[styles.subtitle, { color: t.subColor }]}>{subtitle}</Caption> : null}
        <BodyBold style={[styles.title, { color: t.titleColor }]}>{title}</BodyBold>
      </View>
      {imageUrl ? (
        <CardImage source={imageUrl} style={styles.image} contentFit="contain" />
      ) : null}
    </View>
  );

  if (onPress || href) {
    return (
      <Pressable onPress={handlePress} style={({ pressed }) => pressed && { opacity: 0.92 }}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    minHeight: 140,
    ...shadow.medium,
    overflow: 'hidden',
  },
  textCol: { flex: 1, gap: 6 },
  subtitle: { letterSpacing: 1, fontFamily: fontFamily.semibold },
  title: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.8,
    fontFamily: fontFamily.extrabold,
  },
  image: { width: 100, height: 100, marginLeft: spacing.base },
});

const toneStyle = {
  coral: {
    bg: colors.primary,
    titleColor: '#fff',
    subColor: 'rgba(255,255,255,0.85)',
  },
  peach: {
    bg: colors.cream,
    titleColor: colors.text,
    subColor: colors.textSecondary,
  },
  gold: {
    bg: colors.gold,
    titleColor: colors.text,
    subColor: colors.textSecondary,
  },
} as const;
