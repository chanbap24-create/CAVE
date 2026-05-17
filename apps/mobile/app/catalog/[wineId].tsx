import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { CardImage } from '@/components/CardImage';
import { WineTasteAggregate } from '@/components/WineTasteAggregate';
import { TopComments } from '@/components/TopComments';
import { PartnerSellersList } from '@/components/PartnerSellersList';
import { useWineCatalog } from '@/lib/hooks/useWineCatalog';
import { usePartnerSellersForWine } from '@/lib/hooks/usePartnerSellersForWine';
import { H2, Body, Caption, Eyebrow } from '@/components/Typography';
import { colors, spacing, borderRadius } from '@/constants/theme';

/**
 * 와인 카탈로그 페이지 — wines 테이블 단일 row + 모든 사용자 평가 평균.
 * /wine/[id] (개인 셀러) 와 다른 페이지: wineId 기준 집계.
 */
export default function WineCatalogScreen() {
  const { wineId, from } = useLocalSearchParams<{ wineId: string; from?: string }>();
  const router = useRouter();
  const id = wineId ? parseInt(wineId, 10) : null;
  const { wine, aggregate, topComments, loading } = useWineCatalog(id);
  const { sellers } = usePartnerSellersForWine(id);

  const backOnPress =
    from === 'wines' ? () => router.replace('/(tabs)/wines' as any) :
    from === 'explore' ? () => router.replace('/(tabs)/explore' as any) :
    undefined;
  const backFallback = from === 'wines' ? '/(tabs)/wines' : '/(tabs)/explore';
  const back = <BackButton fallbackPath={backFallback} onPress={backOnPress} />;

  if (loading && !wine) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="" left={back} />
        <Caption tone="muted" style={styles.loading}>불러오는 중…</Caption>
      </View>
    );
  }

  if (!wine) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="" left={back} />
        <Caption tone="muted" style={styles.loading}>와인을 찾을 수 없어요.</Caption>
      </View>
    );
  }

  const locale = [wine.region, wine.country].filter(Boolean).join(', ');

  return (
    <View style={styles.container}>
      <ScreenHeader title="" left={back} />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {/* 와인 이미지 — 정사각 옅은 회색 cream + contain (병이 떠있는 정서) */}
        <View style={styles.coverWrap}>
          {wine.image_url ? (
            <CardImage source={wine.image_url} style={styles.cover} contentFit="contain" />
          ) : (
            <View style={styles.coverEmpty} />
          )}
        </View>

        <View style={styles.identity}>
          {wine.producer ? (
            <Eyebrow tone="primary" style={styles.producer}>{wine.producer}</Eyebrow>
          ) : null}
          <H2 style={styles.wineName}>{wine.name}</H2>
          {wine.name_ko ? <Body tone="muted" style={styles.nameKo}>{wine.name_ko}</Body> : null}
          <Caption tone="muted" style={styles.meta}>
            {locale || '지역 정보 없음'}
            {wine.vintage_year ? ` · ${wine.vintage_year}` : ''}
            {wine.alcohol_pct ? ` · ${wine.alcohol_pct}%` : ''}
          </Caption>
        </View>

        <PartnerSellersList sellers={sellers} />
        <WineTasteAggregate aggregate={aggregate} />
        <TopComments comments={topComments} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { textAlign: 'center', padding: spacing.xl },

  // 이미지 영역 — wines 탭 sales 카드와 동일 톤
  coverWrap: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    aspectRatio: 1,
    backgroundColor: colors.cream,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  cover: { width: '100%', height: '100%' },
  coverEmpty: { flex: 1 },

  identity: {
    paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.borderStrong,
  },
  producer: { letterSpacing: 1.5, marginBottom: spacing.sm },
  wineName: { fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  nameKo: { marginTop: spacing.xs },
  meta: { marginTop: spacing.sm },
});
