import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useTasteProfile } from '@/lib/hooks/useTasteProfile';
import { useMyPicks } from '@/lib/hooks/useMyPicks';
import { useBadgeChecker } from '@/lib/hooks/useBadgeChecker';
import { useCollectionPhoto } from '@/lib/hooks/useCollectionPhoto';
import { useCollectionSocial } from '@/lib/hooks/useCollectionSocial';
import { MyPicksSection } from '@/components/MyPicksSection';
import { CaveHero } from '@/components/CaveHero';
import { FriendsActivityRow } from '@/components/FriendsActivityRow';
// NOTE: AddToCaveSheet (DB search) and AddToCaveMenu (chooser) are hidden
// for now — all wine registration flows through LabelScanSheet. The files
// stay in the repo so we can restore a manual-search fallback later if
// the Vision quota becomes a blocker.
// import { AddToCaveSheet } from '@/components/AddToCaveSheet';
// import { AddToCaveMenu } from '@/components/AddToCaveMenu';
import { LabelScanSheet } from '@/components/LabelScanSheet';
import { CellarList } from '@/components/CellarList';
import { CollectionDetailSheet } from '@/components/CollectionDetailSheet';
import { CellarHeader } from '@/components/CellarHeader';
import { NextGatheringCard } from '@/components/NextGatheringCard';
import { RecommendedGatheringsRow } from '@/components/RecommendedGatheringsRow';
import { RecentlyDrunkRow } from '@/components/RecentlyDrunkRow';
import { LogDrinkSheet } from '@/components/LogDrinkSheet';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useUserGatherings } from '@/lib/hooks/useUserGatherings';
import { useRecommendedGatherings } from '@/lib/hooks/useRecommendedGatherings';
import { useRecentDrinks } from '@/lib/hooks/useRecentDrinks';
import type { CellarActivityItem } from '@/lib/hooks/useCellarActivity';
import { CATEGORY_DB_MAP } from '@/lib/constants/drinkCategories';

const caveTabs = ['전체', '와인', '양주', '전통주', '기타'];
const catDbMap = CATEGORY_DB_MAP;

function packEntry(c: any): CellarActivityItem {
  return {
    id: c.id,
    photo_url: c.photo_url ?? null,
    created_at: c.created_at,
    user_id: c.user_id,
    source: c.source ?? null,
    wine: c.wine ? {
      id: c.wine.id,
      name: c.wine.name,
      producer: c.wine.producer ?? null,
      category: c.wine.category,
      region: c.wine.region ?? null,
      country: c.wine.country ?? null,
      vintage_year: c.wine.vintage_year ?? null,
      image_url: c.wine.image_url ?? null,
    } : null,
    owner: null,
  };
}

export default function CellarScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ openCollection?: string }>();
  const [collections, setCollections] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState('전체');
  const [refreshing, setRefreshing] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [detailEntries, setDetailEntries] = useState<CellarActivityItem[]>([]);
  const { taste, loadTaste } = useTasteProfile(user?.id);
  const { picks, loadPicks, addPick, removePick } = useMyPicks();
  const { checkAndAwardBadges } = useBadgeChecker();
  const { changePhoto } = useCollectionPhoto();
  const { unreadCount, loadUnreadCount } = useNotifications();
  const { gatherings, loadGatherings } = useUserGatherings(user?.id);
  const { recs: recommendedGatherings, loadRecs } = useRecommendedGatherings(user?.id);
  const { drinks: recentDrinks, refresh: refreshDrinks } = useRecentDrinks();
  // 마셨다 기록 시트 — 셀러 long-press 또는 RecentlyDrunkRow + 버튼에서 진입
  const [logDrinkTarget, setLogDrinkTarget] = useState<{ id: number; name: string | null } | null>(null);
  // Batched social counts — one round-trip for all rows vs per-row hooks.
  const social = useCollectionSocial(collections.map(c => c.id));

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadCollections(); loadTaste(); loadPicks();
        loadUnreadCount(); loadGatherings(); loadRecs(); refreshDrinks();
      }
    }, [user])
  );

  // Deep link from notifications: `/(tabs)/cellar?openCollection=123` pops
  // the detail sheet for that wine. Wait until collections are loaded so
  // we can include the joined wine data, then clear the query param so
  // subsequent tab visits don't re-open the sheet.
  useEffect(() => {
    const id = params.openCollection ? Number(params.openCollection) : null;
    if (!id) return;
    const row = collections.find(c => c.id === id);
    if (!row) return;
    setDetailEntries([packEntry(row)]);
    router.setParams({ openCollection: undefined });
  }, [params.openCollection, collections, router]);

  async function loadCollections() {
    if (!user) return;
    const { data } = await supabase
      .from('collections')
      .select('*, wine:wines(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setCollections(data);
  }

  async function removeCave(collectionId: number) {
    await supabase.from('collections').delete().eq('id', collectionId);
    setCollections(prev => prev.filter(c => c.id !== collectionId));
  }

  // Long-press surfaces the row actions. Separates photo management from
  // destructive delete so users can attach/replace a bottle photo without
  // fearing the "Remove" muscle memory.
  function openRowActions(collectionId: number, hasPhoto: boolean) {
    const target = collections.find(c => c.id === collectionId);
    const wineName = target?.wine?.name || null;
    Alert.alert('와인 액션', undefined, [
      {
        text: '마셨다 기록',
        onPress: () => setLogDrinkTarget({ id: collectionId, name: wineName }),
      },
      {
        text: hasPhoto ? '사진 변경' : '사진 추가',
        onPress: async () => {
          const ok = await changePhoto(collectionId);
          if (ok) loadCollections();
        },
      },
      {
        text: '셀러에서 제거',
        style: 'destructive',
        onPress: () => {
          Alert.alert('제거', '이 와인을 셀러에서 제거할까요?', [
            { text: '취소', style: 'cancel' },
            { text: '제거', style: 'destructive', onPress: () => removeCave(collectionId) },
          ]);
        },
      },
      { text: '취소', style: 'cancel' },
    ]);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCollections();
    setRefreshing(false);
  };

  const filtered = activeCat === '전체'
    ? collections
    : collections.filter(c => c.wine?.category === catDbMap[activeCat]);

  // 셀러 탭 홈은 셀러 리스트의 첫 N개만 노출. 나머지는 /cellar/all 전용 화면에서.
  const HOME_LIST_LIMIT = 10;
  const visibleList = filtered.slice(0, HOME_LIST_LIMIT);
  const hiddenCount = Math.max(0, filtered.length - HOME_LIST_LIMIT);

  return (
    <View style={styles.container}>
      <CellarHeader unreadCount={unreadCount} onPlusPress={() => setShowScan(true)} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* docs/icave_concept_updates.md §2 cellar 흡수 순서:
            ① 셀러 헤로  ② 다음 모임 알림  ③ 내 픽  ④ 친구 활동  ⑤ 추천 모임  ⑥ 내 와인  ⑦ 최근 모임 */}
        <CaveHero
          bottles={collections.length}
          gatherings={gatherings.length}
          purchases={collections.filter(c => c.source === 'shop_purchase').length}
          summary={[taste?.topCategory, taste?.topCountry, taste?.topRegion, taste?.topWineType]}
        />

        <NextGatheringCard gatherings={gatherings} />

        {/* 친구 셀러 활동 — 인스타 스토리 톤. 친구가 와인 추가하면 그 친구의
            아바타가 동그라미 링에 노출, 탭하면 최근 추가 와인을 swipe 로 확인.
            기존의 "내 최근 셀러"(RecentlyAddedRow) + "Recent Additions"
            (CellarActivityStrip) 두 비슷한 섹션을 이 한 행으로 통합. */}
        <FriendsActivityRow />

        <MyPicksSection
          picks={picks}
          editable
          onAdd={addPick}
          onRemove={removePick}
          wines={collections}
        />

        <RecommendedGatheringsRow recs={recommendedGatherings} />

        <RecentlyDrunkRow
          drinks={recentDrinks}
          onAddDrink={() => {
            // 시작점이 셀러에서 와인 long-press 라 별도 picker 없음.
            // 빈 상태 안내로 사용자를 long-press 흐름으로 유도.
            Alert.alert('마셨다 기록', '아래 셀러 목록에서 와인을 길게 눌러 추가하세요.');
          }}
        />

        <View style={styles.tabRow}>
          {caveTabs.map(c => (
            <Pressable key={c} style={[styles.tab, activeCat === c && styles.tabActive]} onPress={() => setActiveCat(c)}>
              <Text style={[styles.tabText, activeCat === c && styles.tabTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>

        <CellarList
          collections={visibleList}
          social={social}
          onPressRow={(c) => router.push(`/wine/${c.id}`)}
          onLongPressRow={openRowActions}
        />

        {hiddenCount > 0 && (
          <Pressable
            style={styles.seeAllRow}
            onPress={() => router.push('/cellar/all' as any)}
          >
            <Text style={styles.seeAllText}>
              전체 {filtered.length}병 보기
            </Text>
            <Text style={styles.seeAllArrow}>›</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Legacy sheet kept for the deep-link-from-notifications path
          (?openCollection=<id>). Row taps now navigate to /wine/[id]. */}
      <CollectionDetailSheet
        visible={detailEntries.length > 0}
        entries={detailEntries}
        onClose={() => setDetailEntries([])}
        hideOwner
      />

      <LabelScanSheet
        visible={showScan}
        onClose={() => setShowScan(false)}
        onAdded={() => { loadCollections(); loadTaste(); checkAndAwardBadges(); }}
      />

      <LogDrinkSheet
        visible={!!logDrinkTarget}
        collectionId={logDrinkTarget?.id ?? null}
        wineName={logDrinkTarget?.name ?? null}
        onClose={() => setLogDrinkTarget(null)}
        onLogged={() => { refreshDrinks(); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: '#efefef',
    paddingHorizontal: 16, marginTop: 6,
  },
  tab: { paddingVertical: 10, paddingHorizontal: 14 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#222' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#bbb' },
  tabTextActive: { color: '#222', fontWeight: '600' },

  // "전체 N병 보기" — 셀러 리스트 끝에 한 줄로. 큰 CTA 가 아닌 가벼운 링크.
  seeAllRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, paddingHorizontal: 20,
    gap: 4,
  },
  seeAllText: { fontSize: 13, color: '#7b2d4e', fontWeight: '600' },
  seeAllArrow: { fontSize: 16, color: '#7b2d4e', fontWeight: '600', marginTop: -2 },
});
