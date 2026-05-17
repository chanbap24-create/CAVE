import React, { useEffect, useMemo } from 'react';
import { View, ScrollView, Pressable, Text, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTrendingDrinks } from '@/lib/hooks/useTrendingDrinks';
import { CardImage } from '@/components/CardImage';
import { BodyBold, Caption } from '@/components/Typography';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface Props {
  refreshKey?: number;
  category?: string | null;
}

// wines 탭의 sales 카드와 동일 폭/간격 — 시각 통일.
const PADDING = 16;
const GAP = 12;
const CARD_W = Math.floor((Dimensions.get('window').width - PADDING - GAP * 2) / 2.3);

export function TrendingDrinks({ refreshKey = 0, category }: Props) {
  const router = useRouter();
  const { drinks, loadTrending } = useTrendingDrinks(category);

  useEffect(() => { loadTrending(); }, [refreshKey, loadTrending]);

  if (drinks.length === 0) return null;

  return (
    <ScrollView
      horizontal showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_W + GAP} decelerationRate="fast"
      contentContainerStyle={styles.scroll}
    >
      {drinks.map((d, i) => {
        const meta = [d.region, d.vintage_year].filter(Boolean).join(' · ');
        return (
          <Pressable
            key={d.wine_id}
            style={[styles.card, { width: CARD_W }]}
            onPress={() => router.push(`/catalog/${d.wine_id}?from=wines` as any)}
          >
            {/* 이미지 영역 — sales 카드와 동일 톤 */}
            <View style={[styles.imgWrap, { width: CARD_W, height: CARD_W }]}>
              {d.image_url ? (
                <CardImage source={d.image_url} style={styles.img} contentFit="contain" />
              ) : (
                <View style={styles.imgEmpty} />
              )}
              {/* 좌상단 랭크 */}
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{i + 1}</Text>
              </View>
            </View>

            {/* 본문 — chip + name + count + meta */}
            <View style={styles.body}>
              <View style={styles.addChip}>
                <Caption tone="primary" style={styles.addChipText}>🔥 {d.add_count}명 추가</Caption>
              </View>
              <BodyBold tone="warm" numberOfLines={2} style={styles.name}>{d.name}</BodyBold>
              {meta ? <Caption tone="muted" style={styles.meta}>{meta}</Caption> : null}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingLeft: PADDING, paddingRight: PADDING },
  card: { marginRight: GAP },
  imgWrap: {
    backgroundColor: '#f4f2ed',
    borderRadius: borderRadius.md,
    padding: spacing.base,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  img: { width: '100%', height: '100%' },
  imgEmpty: { flex: 1 },

  rankBadge: {
    position: 'absolute',
    top: spacing.sm, left: spacing.sm,
    backgroundColor: colors.background,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  rankText: {
    fontSize: 12, fontWeight: '800', color: colors.primary,
    letterSpacing: -0.3,
  },

  body: { paddingTop: spacing.sm, gap: spacing.xs },
  addChip: { alignSelf: 'flex-start' },
  addChipText: { fontWeight: '600' },
  name: { fontSize: 13, lineHeight: 17, marginTop: 2 },
  meta: { marginTop: 2 },
});
