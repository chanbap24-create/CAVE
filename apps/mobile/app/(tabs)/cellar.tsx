import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useTasteProfile } from '@/lib/hooks/useTasteProfile';
import { useBadgeChecker } from '@/lib/hooks/useBadgeChecker';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useUserGatherings } from '@/lib/hooks/useUserGatherings';
import { useRecommendedGatherings } from '@/lib/hooks/useRecommendedGatherings';
import { useRecentDrinks } from '@/lib/hooks/useRecentDrinks';
import { useFeaturedCaves } from '@/lib/hooks/useFeaturedCaves';
import { CellarHeader } from '@/components/CellarHeader';
import { CaveHero } from '@/components/CaveHero';
import { NextGatheringCard } from '@/components/NextGatheringCard';
import { FriendsActivityRow } from '@/components/FriendsActivityRow';
import { RecommendedGatheringsRow } from '@/components/RecommendedGatheringsRow';
import { RecentlyDrunkRow } from '@/components/RecentlyDrunkRow';
import { FeaturedCaveCard } from '@/components/FeaturedCaveCard';
import { LabelScanSheet } from '@/components/LabelScanSheet';
import { CollectionDetailSheet } from '@/components/CollectionDetailSheet';
import type { CellarActivityItem } from '@/lib/hooks/useCellarActivity';

type Tab = 'activity' | 'discover';

/**
 * Cellar = "활동/발견 홈". 본인 와인 그리드는 프로필 탭으로 이동됨.
 *
 * 위쪽 persistent: CellarHeader + CaveHero + NextGatheringCard
 * Segmented tabs:
 *   - 활동: 친구 활동 스토리 + 최근 마신 와인
 *   - 발견: 추천 모임 + Featured Caves (다른 사용자 셀러)
 */
export default function CellarScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ openCollection?: string }>();
  const [tab, setTab] = useState<Tab>('activity');
  const [refreshing, setRefreshing] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [detailEntries, setDetailEntries] = useState<CellarActivityItem[]>([]);
  const [collectionCount, setCollectionCount] = useState(0);
  const [purchaseCount, setPurchaseCount] = useState(0);

  const { taste, loadTaste } = useTasteProfile(user?.id);
  const { checkAndAwardBadges } = useBadgeChecker();
  const { unreadCount, loadUnreadCount } = useNotifications();
  const { gatherings, loadGatherings } = useUserGatherings(user?.id);
  const { recs: recommendedGatherings, loadRecs } = useRecommendedGatherings(user?.id);
  const { drinks: recentDrinks, refresh: refreshDrinks } = useRecentDrinks();
  const { caves: featuredCaves, loading: cavesLoading, refresh: refreshCaves } = useFeaturedCaves();

  // 본인 collections count + 구매 source count — CaveHero 통계용 (그리드는 profile)
  const loadCounts = useCallback(async () => {
    if (!user?.id) return;
    const { count: total } = await supabase
      .from('collections').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
    const { count: purchases } = await supabase
      .from('collections').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('source', 'shop_purchase');
    setCollectionCount(total ?? 0);
    setPurchaseCount(purchases ?? 0);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      loadTaste();
      loadCounts();
      loadGatherings();
      loadRecs();
      loadUnreadCount();
      refreshDrinks();
      refreshCaves();
      checkAndAwardBadges();
    }, [user, loadTaste, loadCounts, loadGatherings, loadRecs, loadUnreadCount, refreshDrinks, refreshCaves, checkAndAwardBadges]),
  );

  // openCollection deep-link → CollectionDetailSheet 열기
  useEffect(() => {
    if (!params.openCollection || !user?.id) return;
    const id = parseInt(params.openCollection, 10);
    if (Number.isNaN(id)) return;
    (async () => {
      const { data } = await supabase
        .from('collections')
        .select('id, photo_url, created_at, user_id, source, wine:wines(*)')
        .eq('id', id)
        .maybeSingle();
      if (data) setDetailEntries([data as unknown as CellarActivityItem]);
    })();
  }, [params.openCollection, user?.id]);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([
      loadCounts(), loadGatherings(), loadRecs(),
      refreshDrinks(), refreshCaves(), loadUnreadCount(),
    ]);
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <CellarHeader unreadCount={unreadCount} onPlusPress={() => setShowScan(true)} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Persistent top — 가장 자주 보고 싶은 정보 */}
        <CaveHero
          bottles={collectionCount}
          gatherings={gatherings.length}
          purchases={purchaseCount}
          summary={[taste?.topCategory, taste?.topCountry, taste?.topRegion, taste?.topWineType]}
        />
        <NextGatheringCard gatherings={gatherings} />

        {/* Tabs */}
        <Tabs active={tab} onChange={setTab} />

        {tab === 'activity' && (
          <>
            <FriendsActivityRow />
            <RecentlyDrunkRow drinks={recentDrinks} />
          </>
        )}

        {tab === 'discover' && (
          <>
            <RecommendedGatheringsRow recs={recommendedGatherings} />
            <FeaturedCavesRow caves={featuredCaves} loading={cavesLoading} />
          </>
        )}
      </ScrollView>

      <LabelScanSheet
        visible={showScan}
        onClose={() => setShowScan(false)}
        onAdded={() => { loadCounts(); loadTaste(); checkAndAwardBadges(); }}
      />

      <CollectionDetailSheet
        visible={detailEntries.length > 0}
        entries={detailEntries}
        onClose={() => setDetailEntries([])}
        hideOwner
      />
    </View>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────
function Tabs({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const items: { key: Tab; label: string }[] = [
    { key: 'activity', label: '활동' },
    { key: 'discover', label: '발견' },
  ];
  return (
    <View style={styles.tabsRow}>
      {items.map(it => (
        <Pressable
          key={it.key}
          style={[styles.tabBtn, active === it.key && styles.tabBtnActive]}
          onPress={() => onChange(it.key)}
        >
          <Text style={[styles.tabText, active === it.key && styles.tabTextActive]}>{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Featured caves (가로 스크롤 카드) ─────────────────────────────
function FeaturedCavesRow({ caves, loading }: { caves: any[]; loading: boolean }) {
  if (loading && caves.length === 0) {
    return <ActivityIndicator color="#7b2d4e" style={{ marginTop: 24 }} />;
  }
  if (caves.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>지금 보여줄 셀러가 없어요</Text>
      </View>
    );
  }
  return (
    <View style={styles.featuredWrap}>
      <Text style={styles.sectionTitle}>친구의 셀러</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>
        {caves.map(c => <FeaturedCaveCard key={c.user_id} cave={c} />)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: '#efefef',
    marginTop: 8,
  },
  tabBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: '#222' },
  tabText: { fontSize: 13, color: '#999', fontWeight: '500' },
  tabTextActive: { color: '#222', fontWeight: '700' },

  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#999' },

  featuredWrap: { marginTop: 24 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#222',
    paddingHorizontal: 20, marginBottom: 10,
  },
  featuredScroll: { paddingHorizontal: 16, paddingRight: 8, gap: 12 },
});
