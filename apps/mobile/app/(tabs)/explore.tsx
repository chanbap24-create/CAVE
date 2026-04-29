import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useFeaturedCaves } from '@/lib/hooks/useFeaturedCaves';
import { useGatherings } from '@/lib/hooks/useGatherings';
import { FeaturedCaveCard } from '@/components/FeaturedCaveCard';
import { TrendingDrinks } from '@/components/TrendingDrinks';
import { SeasonClubHero } from '@/components/SeasonClubHero';
import { PartnerGatheringsRow } from '@/components/PartnerGatheringsRow';
import { UserGatheringsRow } from '@/components/UserGatheringsRow';
// PopularPosts deprecated — posts 진입점 차단 (v1#5).
import { CategoryChips } from '@/components/CategoryChips';
import { WinesSearchResults } from '@/components/WinesSearchResults';
import { ScreenHeader } from '@/components/ScreenHeader';
import { sanitizeSearch } from '@/lib/utils/searchUtils';
import Svg, { Circle, Line } from 'react-native-svg';

import { CATEGORY_FILTERS, CATEGORY_DB_MAP } from '@/lib/constants/drinkCategories';

const categories = CATEGORY_FILTERS;
const catDbMap = CATEGORY_DB_MAP;

const DRINKS_LIMIT = 50;
const SEARCH_DEBOUNCE_MS = 300;
const REFRESH_CACHE_MS = 30_000;

export default function ExploreScreen() {
  const [drinks, setDrinks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('전체');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  // Category filter flows through to the three discover sections (Featured
  // Caves / Trending Drinks / Popular Posts) — each hook applies the filter
  // server-side. Under '전체' the hooks fall back to their default behavior.
  const categoryKey = activeCat !== '전체' ? catDbMap[activeCat] : null;
  const { caves: featuredCaves, refresh: loadFeatured } = useFeaturedCaves(categoryKey);
  const { gatherings, loadGatherings } = useGatherings(categoryKey);

  const reqSeqRef = useRef(0);          // monotonic request id for race protection
  const lastLoadRef = useRef(0);         // timestamp of last cache-invalidating load

  const inSearchMode = search.length >= 2;

  const loadDrinks = useCallback(async (query: string, cat: string) => {
    const reqId = ++reqSeqRef.current;

    let q = supabase
      .from('wines')
      .select('id, name, name_ko, category, country, region, alcohol_pct')
      .order('name')
      .limit(DRINKS_LIMIT);

    if (query.length >= 2) {
      const s = sanitizeSearch(query);
      q = q.or(`name.ilike.%${s}%,name_ko.ilike.%${s}%,region.ilike.%${s}%,country.ilike.%${s}%`);
    }
    if (cat !== '전체') {
      q = q.eq('category', catDbMap[cat]);
    }

    const { data } = await q;

    // Drop stale responses — a newer query superseded us.
    if (reqId !== reqSeqRef.current) return;

    setDrinks(data ?? []);
  }, []);

  // Debounced wine list fetch — only under '전체' with an active search.
  // Category mode uses usePostsByCategory instead, no drinks fetch needed.
  useEffect(() => {
    if (!inSearchMode) {
      setDrinks([]);
      return;
    }
    const h = setTimeout(() => { loadDrinks(search, activeCat); }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(h);
  }, [search, activeCat, inSearchMode, loadDrinks]);

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
    await Promise.all([
      loadFeatured(),
      loadGatherings(),
      inSearchMode ? loadDrinks(search, activeCat) : Promise.resolve(),
    ]);
    setRefreshKey(k => k + 1);
    setRefreshing(false);
  }, [loadFeatured, loadGatherings, loadDrinks, search, activeCat, inSearchMode]);

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />
  );

  return (
    <View style={styles.container}>
      <ScreenHeader variant="centered" title="발견" />

      {/* Search bar — always visible */}
      <View style={styles.searchBox}>
        <Svg style={styles.searchIcon} width={18} height={18} fill="none" stroke="#bbb" strokeWidth={1.8} viewBox="0 0 24 24">
          <Circle cx={11} cy={11} r={8} />
          <Line x1={21} y1={21} x2={16.65} y2={16.65} />
        </Svg>
        <TextInput
          style={styles.searchInput}
          placeholder="와인, 위스키, 사케 검색..."
          placeholderTextColor="#bbb"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <Pressable style={styles.searchClear} onPress={() => setSearch('')} hitSlop={10}>
            <Text style={styles.searchClearText}>×</Text>
          </Pressable>
        )}
      </View>

      <CategoryChips categories={categories} active={activeCat} onChange={setActiveCat} />

      {inSearchMode ? (
        <WinesSearchResults
          drinks={drinks}
          limit={DRINKS_LIMIT}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : (
        <ScrollView refreshControl={refreshControl} showsVerticalScrollIndicator={false}>
          {/* docs/icave_concept_updates.md §4 트레바리식 위계 (위→아래로 큐레이션 강도 약해짐):
              ① 시즌 클럽 (히어로)  ② 진행 중 클럽  ③ 시음회  ④ 유저 모임  ⑤ 가이드  ⑥ 샵 둘러보기.
              v1: 시즌 클럽 placeholder + 유저 모임 + 기존 Featured Caves / Trending Drinks 유지.
              v2 에서 진행 중 클럽 / 시음회 / 가이드 / 샵 섹션 추가. */}
          <SeasonClubHero />

          <PartnerGatheringsRow gatherings={gatherings} />

          <UserGatheringsRow gatherings={gatherings} />

          {featuredCaves.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>추천 셀러</Text>
              <View style={styles.caveGrid}>
                {featuredCaves.map(cave => (
                  <FeaturedCaveCard key={cave.user_id} cave={cave} />
                ))}
              </View>
            </>
          )}

          <TrendingDrinks refreshKey={refreshKey} category={categoryKey} />

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchBox: { margin: 12, marginHorizontal: 16, position: 'relative' },
  searchIcon: { position: 'absolute', left: 12, top: 10, zIndex: 1 },
  searchInput: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 10, paddingLeft: 38, paddingRight: 36, fontSize: 14 },
  searchClear: { position: 'absolute', right: 10, top: 6, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  searchClearText: { fontSize: 18, color: '#999', lineHeight: 20 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#222', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  caveGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16,
  },
});
