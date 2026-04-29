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
import { RecentlyAddedRow } from '@/components/RecentlyAddedRow';
import { CellarActivityStrip } from '@/components/CellarActivityStrip';
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
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useUserGatherings } from '@/lib/hooks/useUserGatherings';
import type { CellarActivityItem } from '@/lib/hooks/useCellarActivity';
import { CATEGORY_DB_MAP } from '@/lib/constants/drinkCategories';

const caveTabs = ['All', 'Wine', 'Spirit', 'Traditional', 'Other'];
const catDbMap = CATEGORY_DB_MAP;

function packEntry(c: any): CellarActivityItem {
  return {
    id: c.id,
    photo_url: c.photo_url ?? null,
    created_at: c.created_at,
    user_id: c.user_id,
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
  const [activeCat, setActiveCat] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [detailEntries, setDetailEntries] = useState<CellarActivityItem[]>([]);
  const { taste, loadTaste } = useTasteProfile(user?.id);
  const { picks, loadPicks, addPick, removePick } = useMyPicks();
  const { checkAndAwardBadges } = useBadgeChecker();
  const { changePhoto } = useCollectionPhoto();
  const { unreadCount, loadUnreadCount } = useNotifications();
  const { gatherings, loadGatherings } = useUserGatherings(user?.id);
  // Batched social counts — one round-trip for all rows vs per-row hooks.
  const social = useCollectionSocial(collections.map(c => c.id));

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadCollections(); loadTaste(); loadPicks();
        loadUnreadCount(); loadGatherings();
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
    Alert.alert('Bottle actions', undefined, [
      {
        text: hasPhoto ? 'Change photo' : 'Add photo',
        onPress: async () => {
          const ok = await changePhoto(collectionId);
          if (ok) loadCollections();
        },
      },
      {
        text: 'Remove from Cave',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Remove', 'Remove this from your Cave?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeCave(collectionId) },
          ]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCollections();
    setRefreshing(false);
  };

  const filtered = activeCat === 'All'
    ? collections
    : collections.filter(c => c.wine?.category === catDbMap[activeCat]);

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
          summary={[taste?.topCategory, taste?.topCountry, taste?.topRegion, taste?.topWineType]}
        />

        <NextGatheringCard gatherings={gatherings} />

        {/* 기존 큐레이션 행들 — 위치는 §2 가이드에 맞춰 점진적으로 정리 */}
        <RecentlyAddedRow wines={collections} />

        <CellarActivityStrip />

        <MyPicksSection
          picks={picks}
          editable
          onAdd={addPick}
          onRemove={removePick}
          wines={collections}
        />

        <View style={styles.tabRow}>
          {caveTabs.map(c => (
            <Pressable key={c} style={[styles.tab, activeCat === c && styles.tabActive]} onPress={() => setActiveCat(c)}>
              <Text style={[styles.tabText, activeCat === c && styles.tabTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>

        <CellarList
          collections={filtered}
          social={social}
          onPressRow={(c) => router.push(`/wine/${c.id}`)}
          onLongPressRow={openRowActions}
        />
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
});
