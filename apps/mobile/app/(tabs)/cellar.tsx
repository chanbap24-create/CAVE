import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
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
// NOTE: AddToCaveSheet (DB search) and AddToCaveMenu (chooser) are hidden
// for now — all wine registration flows through LabelScanSheet. The files
// stay in the repo so we can restore a manual-search fallback later if
// the Vision quota becomes a blocker.
// import { AddToCaveSheet } from '@/components/AddToCaveSheet';
// import { AddToCaveMenu } from '@/components/AddToCaveMenu';
import { LabelScanSheet } from '@/components/LabelScanSheet';
import { CellarList } from '@/components/CellarList';
import { CollectionDetailSheet } from '@/components/CollectionDetailSheet';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { CellarActivityItem } from '@/lib/hooks/useCellarActivity';
import Svg, { Line } from 'react-native-svg';
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
  // Batched social counts — one round-trip for all rows vs per-row hooks.
  const social = useCollectionSocial(collections.map(c => c.id));

  useFocusEffect(
    useCallback(() => {
      if (user) { loadCollections(); loadTaste(); loadPicks(); }
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
      <ScreenHeader
        variant="centered"
        title="My Cave"
        left={
          <Pressable onPress={() => setShowScan(true)} hitSlop={8}>
            <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
              <Line x1={12} y1={5} x2={12} y2={19} />
              <Line x1={5} y1={12} x2={19} y2={12} />
            </Svg>
          </Pressable>
        }
      />

      <CaveHero
        bottles={collections.length}
        summary={[taste?.topCategory, taste?.topCountry, taste?.topRegion, taste?.topWineType]}
      />

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
        refreshing={refreshing}
        onRefresh={onRefresh}
        social={social}
        onPressRow={(c) => setDetailEntries([packEntry(c)])}
        onLongPressRow={openRowActions}
      />

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

  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#efefef', paddingHorizontal: 16 },
  tab: { paddingVertical: 12, paddingHorizontal: 16 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#222' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#bbb' },
  tabTextActive: { color: '#222', fontWeight: '600' },
});
