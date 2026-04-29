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
import { CategoryChips } from '@/components/CategoryChips';
import { ScreenHeader } from '@/components/ScreenHeader';

import { CATEGORY_FILTERS, CATEGORY_DB_MAP } from '@/lib/constants/drinkCategories';

const categories = CATEGORY_FILTERS;
const catDbMap = CATEGORY_DB_MAP;

const REFRESH_CACHE_MS = 30_000;

export default function ExploreScreen() {
  // 검색 기능은 제거됨 (사용자 요구) — Discover 는 큐레이션 발견 전용.
  // 와인/주류 직접 검색은 추후 별도 진입점(예: cellar 의 "+" 라벨 스캔, 모임 탭 검색)으로.
  const [activeCat, setActiveCat] = useState('전체');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const categoryKey = activeCat !== '전체' ? catDbMap[activeCat] : null;
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

      <CategoryChips categories={categories} active={activeCat} onChange={setActiveCat} />

      <ScrollView refreshControl={refreshControl} showsVerticalScrollIndicator={false}>
        {/* docs/icave_concept_updates.md §4 트레바리식 위계 (위→아래로 큐레이션 강도 약해짐):
            ① 시즌 클럽 (히어로)  ② 파트너 모임  ③ 유저 모임  ④ 셀러 발견  ⑤ 트렌딩  ⑥ 가이드  ⑦ 샵 둘러보기 */}
        <SeasonClubHero />

        <PartnerGatheringsRow gatherings={gatherings} />

        <UserGatheringsRow gatherings={gatherings} />

        {featuredCaves.length > 0 && (
          <View style={styles.cavesWrap}>
            <DiscoverSectionHeader
              title="셀러 발견"
              subtitle="다양한 취향의 컬렉터들을 만나보세요"
              actionLabel={null}
            />
            <View style={styles.caveGrid}>
              {featuredCaves.map(cave => (
                <FeaturedCaveCard key={cave.user_id} cave={cave} />
              ))}
            </View>
          </View>
        )}

        <View style={styles.trendingWrap}>
          <DiscoverSectionHeader
            title="트렌딩 주류"
            subtitle="요즘 컬렉터들이 자주 셀러에 담는 와인·주류"
            actionLabel={null}
          />
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
  caveGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16,
  },
});
