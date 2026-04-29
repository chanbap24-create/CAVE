import React, { useState, useCallback, useRef } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useFeaturedCaves } from '@/lib/hooks/useFeaturedCaves';
import { useGatherings } from '@/lib/hooks/useGatherings';
import { FeaturedCaveCard } from '@/components/FeaturedCaveCard';
import { TrendingDrinks } from '@/components/TrendingDrinks';
import { SeasonClubHero } from '@/components/SeasonClubHero';
import { PartnerGatheringsRow } from '@/components/PartnerGatheringsRow';
import { UserGatheringsRow } from '@/components/UserGatheringsRow';
import { EditorGuidesSection } from '@/components/EditorGuidesSection';
import { ShopBrowseSection } from '@/components/ShopBrowseSection';
import { DiscoverSectionHeader } from '@/components/DiscoverSectionHeader';
import { ScreenHeader } from '@/components/ScreenHeader';
import { HORIZONTAL_PADDING } from '@/lib/utils/discoverCardWidth';

const REFRESH_CACHE_MS = 30_000;

export default function ExploreScreen() {
  // 검색/카테고리 칩 모두 제거됨 (사용자 요구) — Discover 는 큐레이션 흐름만.
  // 카테고리 필터가 필요해지면 각 섹션 단위 칩(또는 모임 탭 내부 필터)으로 분산.
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 카테고리 필터 비활성 — 각 hook 은 null 로 호출되어 default 동작 (전체).
  const categoryKey: string | null = null;
  const { caves: featuredCaves, refresh: loadFeatured } = useFeaturedCaves(categoryKey);
  const { gatherings, loadGatherings } = useGatherings(categoryKey);

  const lastLoadRef = useRef(0);

  // Refresh Discover feed data on focus (30s cache).
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastLoadRef.current > REFRESH_CACHE_MS) {
        lastLoadRef.current = now;
        loadFeatured();
        loadGatherings();
        setRefreshKey(k => k + 1);
      }
    }, [loadFeatured, loadGatherings])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    lastLoadRef.current = Date.now();
    await Promise.all([loadFeatured(), loadGatherings()]);
    setRefreshKey(k => k + 1);
    setRefreshing(false);
  }, [loadFeatured, loadGatherings]);

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />
  );

  return (
    <View style={styles.container}>
      <ScreenHeader variant="centered" title="발견" />

      <ScrollView refreshControl={refreshControl} showsVerticalScrollIndicator={false}>
        {/* docs/icave_concept_updates.md §4 트레바리식 위계 (위→아래로 큐레이션 강도 약해짐):
            ① 시즌 클럽 (히어로)  ② 파트너 모임  ③ 유저 모임  ④ 셀러 발견  ⑤ 트렌딩  ⑥ 가이드  ⑦ 샵 둘러보기 */}
        <SeasonClubHero />

        <PartnerGatheringsRow gatherings={gatherings} />

        <UserGatheringsRow gatherings={gatherings} />

        {featuredCaves.length > 0 && (
          <View style={styles.cavesWrap}>
            <DiscoverSectionHeader title="셀러 발견" actionLabel={null} />
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollRow}
            >
              {featuredCaves.map(cave => (
                <FeaturedCaveCard key={cave.user_id} cave={cave} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.trendingWrap}>
          <DiscoverSectionHeader title="트렌딩 주류" actionLabel={null} />
          <TrendingDrinks refreshKey={refreshKey} category={categoryKey} />
        </View>

        <EditorGuidesSection />

        <ShopBrowseSection />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  cavesWrap: { marginTop: 32 },
  trendingWrap: { marginTop: 32 },
  scrollRow: {
    paddingLeft: HORIZONTAL_PADDING, paddingRight: HORIZONTAL_PADDING / 2,
  },
});
