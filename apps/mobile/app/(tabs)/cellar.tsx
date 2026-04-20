import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useTasteProfile } from '@/lib/hooks/useTasteProfile';
import { useMyPicks } from '@/lib/hooks/useMyPicks';
import { useBadgeChecker } from '@/lib/hooks/useBadgeChecker';
import { useCollectionPhoto } from '@/lib/hooks/useCollectionPhoto';
import { MyPicksSection } from '@/components/MyPicksSection';
import { TasteCard } from '@/components/TasteCard';
import { AddToCaveSheet } from '@/components/AddToCaveSheet';
import { AddToCaveMenu } from '@/components/AddToCaveMenu';
import { LabelScanSheet } from '@/components/LabelScanSheet';
import { CellarList } from '@/components/CellarList';
import { ScreenHeader } from '@/components/ScreenHeader';
import Svg, { Line } from 'react-native-svg';
import { CATEGORY_DB_MAP } from '@/lib/constants/drinkCategories';

const caveTabs = ['All', 'Wine', 'Whisky', 'Sake', 'Other'];
const catDbMap = CATEGORY_DB_MAP;

export default function CellarScreen() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const { taste, loadTaste } = useTasteProfile(user?.id);
  const { picks, loadPicks, addPick, removePick } = useMyPicks();
  const { checkAndAwardBadges } = useBadgeChecker();
  const { changePhoto } = useCollectionPhoto();

  useFocusEffect(
    useCallback(() => {
      if (user) { loadCollections(); loadTaste(); loadPicks(); }
    }, [user])
  );

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

  const countries = new Set(collections.map(c => c.wine?.country).filter(Boolean));
  const types = new Set(collections.map(c => c.wine?.category).filter(Boolean));

  return (
    <View style={styles.container}>
      <ScreenHeader
        variant="centered"
        title="My Cave"
        left={
          <Pressable onPress={() => setShowMenu(true)} hitSlop={8}>
            <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
              <Line x1={12} y1={5} x2={12} y2={19} />
              <Line x1={5} y1={12} x2={19} y2={12} />
            </Svg>
          </Pressable>
        }
      />

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{collections.length}</Text>
          <Text style={styles.statLabel}>Bottles</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{countries.size}</Text>
          <Text style={styles.statLabel}>Countries</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{types.size}</Text>
          <Text style={styles.statLabel}>Types</Text>
        </View>
      </View>

      <MyPicksSection
        picks={picks}
        editable
        onAdd={addPick}
        onRemove={removePick}
        wines={collections}
      />

      {taste && <TasteCard taste={taste} compact />}

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
        onLongPressRow={openRowActions}
      />

      <AddToCaveMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        onSearch={() => setShowSearch(true)}
        onScan={() => setShowScan(true)}
      />

      <AddToCaveSheet
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onAdded={() => { loadCollections(); loadTaste(); checkAndAwardBadges(); }}
        existingIds={new Set(collections.map(c => c.wine_id))}
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
  stats: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 20, marginHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '700', color: '#222' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 2, fontWeight: '500' },

  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#efefef', paddingHorizontal: 16 },
  tab: { paddingVertical: 12, paddingHorizontal: 16 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#222' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#bbb' },
  tabTextActive: { color: '#222', fontWeight: '600' },
});
