import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { WineTasteAggregate } from '@/components/WineTasteAggregate';
import { TopComments } from '@/components/TopComments';
import { PartnerSellersList } from '@/components/PartnerSellersList';
import { useWineCatalog } from '@/lib/hooks/useWineCatalog';
import { usePartnerSellersForWine } from '@/lib/hooks/usePartnerSellersForWine';

/**
 * 와인 카탈로그 페이지 — wines 테이블 단일 row + 모든 사용자 평가 평균.
 *
 * /wine/[id] (개인 셀러 컬렉션) 와 다른 페이지: wineId 기준 집계.
 */
export default function WineCatalogScreen() {
  const { wineId } = useLocalSearchParams<{ wineId: string }>();
  const id = wineId ? parseInt(wineId, 10) : null;
  const { wine, aggregate, topComments, loading } = useWineCatalog(id);
  const { sellers } = usePartnerSellersForWine(id);

  if (loading && !wine) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="와인" left={<BackButton />} />
        <Text style={styles.loading}>불러오는 중…</Text>
      </View>
    );
  }

  if (!wine) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="와인" left={<BackButton />} />
        <Text style={styles.loading}>와인을 찾을 수 없어요.</Text>
      </View>
    );
  }

  const locale = [wine.region, wine.country].filter(Boolean).join(', ');

  return (
    <View style={styles.container}>
      <ScreenHeader title="와인" left={<BackButton />} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {wine.image_url ? (
          <Image source={wine.image_url} style={styles.cover} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]} />
        )}

        <View style={styles.identity}>
          {wine.producer && <Text style={styles.producer}>{wine.producer}</Text>}
          <Text style={styles.wineName}>{wine.name}</Text>
          {wine.name_ko && <Text style={styles.nameKo}>{wine.name_ko}</Text>}
          <Text style={styles.meta}>
            {locale || '지역 정보 없음'}
            {wine.vintage_year ? ` · ${wine.vintage_year}` : ''}
            {wine.alcohol_pct ? ` · ${wine.alcohol_pct}%` : ''}
          </Text>
        </View>

        <PartnerSellersList sellers={sellers} />
        <WineTasteAggregate aggregate={aggregate} />
        <TopComments comments={topComments} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loading: { textAlign: 'center', color: '#999', padding: 40, fontSize: 13 },

  cover: { width: '100%', aspectRatio: 1, backgroundColor: '#f5f5f5' },
  coverPlaceholder: { backgroundColor: '#f0eaec' },

  identity: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  producer: { fontSize: 12, fontWeight: '700', color: '#7b2d4e', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  wineName: { fontSize: 20, fontWeight: '700', color: '#222', lineHeight: 26 },
  nameKo: { fontSize: 14, color: '#666', marginTop: 4 },
  meta: { fontSize: 12, color: '#999', marginTop: 6 },
});
