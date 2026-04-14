import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Pressable, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useFeaturedCaves } from '@/lib/hooks/useFeaturedCaves';
import { FeaturedCaveCard } from '@/components/FeaturedCaveCard';
import { TrendingDrinks } from '@/components/TrendingDrinks';
import { PopularPosts } from '@/components/PopularPosts';
import Svg, { Path, Circle, Line } from 'react-native-svg';

const categories = ['All', 'Wine', 'Whisky', 'Sake', 'Cognac', 'Other'];
const catDbMap: Record<string, string> = { Wine: 'wine', Whisky: 'whiskey', Sake: 'sake', Cognac: 'cognac', Other: 'other' };
const bgColors: Record<string, string> = { wine: '#f0e8dd', whiskey: '#e8ddd0', sake: '#e0e8f0', cognac: '#ede5d8', other: '#e8e8e8' };
const tagStyles: Record<string, { bg: string; color: string }> = {
  wine: { bg: '#f7f0f3', color: '#7b2d4e' },
  whiskey: { bg: '#f5f0e8', color: '#8a6d3b' },
  sake: { bg: '#eef2f7', color: '#3b6d8a' },
  cognac: { bg: '#f5efe8', color: '#8a5a3b' },
  other: { bg: '#f0f0f0', color: '#666' },
};


export default function ExploreScreen() {
  const { user } = useAuth();
  const [drinks, setDrinks] = useState<any[]>([]);
  const [myCollection, setMyCollection] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const { caves: featuredCaves } = useFeaturedCaves();

  useEffect(() => {
    loadDrinks();
    if (user) loadMyCollection();
  }, [user]);

  async function loadDrinks() {
    const { data } = await supabase.from('wines').select('*').order('name');
    if (data) setDrinks(data);
  }

  async function loadMyCollection() {
    if (!user) return;
    const { data } = await supabase.from('collections').select('wine_id').eq('user_id', user.id);
    if (data) setMyCollection(new Set(data.map(c => c.wine_id)));
  }

  async function toggleCave(wineId: number) {
    if (!user) return Alert.alert('Sign in required', 'Please sign in to add to your Cave');

    if (myCollection.has(wineId)) {
      // Remove
      await supabase.from('collections').delete().eq('user_id', user.id).eq('wine_id', wineId);
      setMyCollection(prev => { const next = new Set(prev); next.delete(wineId); return next; });
    } else {
      // Add
      const { error } = await supabase.from('collections').insert({
        user_id: user.id,
        wine_id: wineId,
        source: 'search',
      });
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      setMyCollection(prev => new Set(prev).add(wineId));
    }
  }

  const filtered = drinks.filter(d => {
    const matchCat = activeCat === 'All' || d.category === catDbMap[activeCat];
    const q = search.toLowerCase();
    const matchSearch = !q || d.name.toLowerCase().includes(q) || (d.name_ko && d.name_ko.includes(q)) || (d.region && d.region.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
      </View>

      {/* Search bar always visible */}
      <View style={styles.searchBox}>
        <Svg style={styles.searchIcon} width={18} height={18} fill="none" stroke="#bbb" strokeWidth={1.8} viewBox="0 0 24 24">
          <Circle cx={11} cy={11} r={8} />
          <Line x1={21} y1={21} x2={16.65} y2={16.65} />
        </Svg>
        <TextInput
          style={styles.searchInput}
          placeholder="Search wines, whisky, sake..."
          placeholderTextColor="#bbb"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable style={styles.searchClear} onPress={() => setSearch('')}>
            <Text style={styles.searchClearText}>x</Text>
          </Pressable>
        )}
      </View>

      {/* Search mode: show results */}
      {search.length > 0 ? (
        <View style={{ flex: 1 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {categories.map(c => (
              <Pressable key={c} style={[styles.catBtn, activeCat === c && styles.catBtnActive]} onPress={() => setActiveCat(c)}>
                <Text style={[styles.catBtnText, activeCat === c && styles.catBtnTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.browseCount}>{filtered.length} items</Text>
          <ScrollView>
            {filtered.map(d => {
              const tag = tagStyles[d.category] || tagStyles.other;
              const label = d.category === 'whiskey' ? 'Whisky' : d.category.charAt(0).toUpperCase() + d.category.slice(1);
              const inCave = myCollection.has(d.id);
              return (
                <View key={d.id} style={styles.browseItem}>
                  <View style={[styles.browseThumb, { backgroundColor: bgColors[d.category] || '#f0f0f0' }]} />
                  <View style={styles.browseInfo}>
                    <Text style={styles.browseName} numberOfLines={1}>{d.name}</Text>
                    {d.name_ko && <Text style={styles.browseNameKo}>{d.name_ko}</Text>}
                    <Text style={styles.browseMeta}>{[d.region, d.country].filter(Boolean).join(', ')}</Text>
                    <View style={[styles.browseCatTag, { backgroundColor: tag.bg }]}>
                      <Text style={[styles.browseCatText, { color: tag.color }]}>{label}</Text>
                    </View>
                  </View>
                  <Pressable
                    style={[styles.addBtn, inCave && styles.addBtnAdded]}
                    onPress={() => toggleCave(d.id)}
                  >
                    <Text style={[styles.addBtnText, inCave && styles.addBtnTextAdded]}>
                      {inCave ? 'Added' : '+ Add'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        /* Discover feed */
        <ScrollView showsVerticalScrollIndicator={false}>
          {featuredCaves.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Featured Caves</Text>
              <View style={styles.caveGrid}>
                {featuredCaves.map(cave => (
                  <FeaturedCaveCard key={cave.user_id} cave={cave} />
                ))}
              </View>
            </>
          )}

          <TrendingDrinks />

          <PopularPosts />

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#222' },

  searchBox: { margin: 12, marginHorizontal: 16, position: 'relative' },
  searchIcon: { position: 'absolute', left: 12, top: 10, zIndex: 1 },
  searchInput: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 10, paddingLeft: 38, fontSize: 14 },
  searchClear: { position: 'absolute', right: 12, top: 8 },
  searchClearText: { fontSize: 16, color: '#999' },
  catScroll: { flexGrow: 0, marginBottom: 4 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#efefef', backgroundColor: '#fff' },
  catBtnActive: { backgroundColor: '#222', borderColor: '#222' },
  catBtnText: { fontSize: 13, fontWeight: '500', color: '#999' },
  catBtnTextActive: { color: '#fff' },
  browseCount: { fontSize: 12, color: '#bbb', paddingHorizontal: 16, paddingBottom: 8 },
  browseItem: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16, gap: 14, borderBottomWidth: 1, borderBottomColor: '#f8f8f8' },
  browseThumb: { width: 52, height: 52, borderRadius: 10 },
  browseInfo: { flex: 1 },
  browseName: { fontSize: 14, fontWeight: '600', color: '#222' },
  browseNameKo: { fontSize: 11, color: '#aaa', marginTop: 1 },
  browseMeta: { fontSize: 11, color: '#999', marginTop: 3 },
  browseCatTag: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  browseCatText: { fontSize: 10, fontWeight: '600' },
  addBtn: { backgroundColor: '#7b2d4e', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  addBtnAdded: { backgroundColor: '#f0f0f0' },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  addBtnTextAdded: { color: '#999' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#222', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  caveGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16,
  },

  emptyDiscover: { alignItems: 'center', paddingTop: 80 },
  emptyDiscoverTitle: { fontSize: 17, fontWeight: '600', color: '#222', marginBottom: 6 },
  emptyDiscoverDesc: { fontSize: 14, color: '#999' },
});
