import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import { useTasteProfile } from '@/lib/hooks/useTasteProfile';
import { useMyPicks } from '@/lib/hooks/useMyPicks';
import { MyPicksSection } from '@/components/MyPicksSection';
import Svg, { Line } from 'react-native-svg';
import { TasteCard } from '@/components/TasteCard';
import { AddToCaveSheet } from '@/components/AddToCaveSheet';
import { useBadgeChecker } from '@/lib/hooks/useBadgeChecker';

const bgColors: Record<string, string> = { wine: '#f0e8dd', whiskey: '#e8ddd0', sake: '#e0e8f0', cognac: '#ede5d8', other: '#e8e8e8' };
const typeColors: Record<string, string> = { wine: '#7b2d4e', whiskey: '#8a6d3b', sake: '#3b6d8a', cognac: '#8a5a3b', other: '#999' };
const labelMap: Record<string, string> = { wine: 'Wine', whiskey: 'Whisky', sake: 'Sake', cognac: 'Cognac', other: 'Other' };
const caveTabs = ['All', 'Wine', 'Whisky', 'Sake', 'Other'];
const catDbMap: Record<string, string> = { Wine: 'wine', Whisky: 'whiskey', Sake: 'sake', Other: 'other' };

export default function CellarScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const { taste, loadTaste } = useTasteProfile(user?.id);
  const { picks, loadPicks, addPick, removePick } = useMyPicks();
  const { checkAndAwardBadges } = useBadgeChecker();

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
    Alert.alert('Remove', 'Remove this from your Cave?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await supabase.from('collections').delete().eq('id', collectionId);
          setCollections(prev => prev.filter(c => c.id !== collectionId));
        },
      },
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
      <View style={styles.header}>
        <Pressable style={styles.headerLeft} onPress={() => setShowAdd(true)}>
          <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
            <Line x1={12} y1={5} x2={12} y2={19} />
            <Line x1={5} y1={12} x2={19} y2={12} />
          </Svg>
        </Pressable>
        <Text style={styles.title}>My Cave</Text>
      </View>

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

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Cave is empty</Text>
          <Text style={styles.emptyDesc}>Tap "+ Add" to start{'\n'}your collection</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />}
        >
          {filtered.map(c => {
            const w = c.wine;
            if (!w) return null;
            const typeColor = typeColors[w.category] || '#999';
            return (
              <Pressable key={c.id} style={styles.listItem} onLongPress={() => removeCave(c.id)}>
                <View style={[styles.listDot, { backgroundColor: typeColor }]} />
                <View style={styles.listInfo}>
                  <Text style={styles.listName} numberOfLines={1}>{w.name}</Text>
                  <Text style={styles.listMeta}>
                    {[w.region, w.country].filter(Boolean).join(', ')}
                    {w.vintage_year ? ` · ${w.vintage_year}` : ''}
                  </Text>
                </View>
                <View style={styles.listRight}>
                  <Text style={[styles.listType, { color: typeColor }]}>{labelMap[w.category] || w.category}</Text>
                  {w.alcohol_pct && <Text style={styles.listAlc}>{w.alcohol_pct}%</Text>}
                </View>
              </Pressable>
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <AddToCaveSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => { loadCollections(); loadTaste(); checkAndAwardBadges(); }}
        existingIds={new Set(collections.map(c => c.wine_id))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
    alignItems: 'center',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#222' },
  headerLeft: { position: 'absolute', left: 20, bottom: 10 },

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

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#222', marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 22 },

  listItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
    gap: 12,
  },
  listDot: { width: 8, height: 8, borderRadius: 4 },
  listInfo: { flex: 1 },
  listName: { fontSize: 14, fontWeight: '600', color: '#222' },
  listMeta: { fontSize: 11, color: '#999', marginTop: 3 },
  listRight: { alignItems: 'flex-end' },
  listType: { fontSize: 11, fontWeight: '600' },
  listAlc: { fontSize: 10, color: '#bbb', marginTop: 2 },
});
