import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Pressable, Dimensions, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import Svg, { Path, Circle, Line } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.52;

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

const featuredCaves = [
  { avatar: 'MJ', avatarBg: '#f0e8dd', name: 'wine_master_mj', desc: '10 countries, 52 bottles', badges: ['Collector', 'World Traveler'], gradient: '#e8d5c4' },
  { avatar: 'TK', avatarBg: '#d4c5e2', name: 'tokyo_whisky', desc: 'Japanese Whisky specialist', badges: ['Whisky Explorer'], gradient: '#d4c0a0' },
  { avatar: 'YR', avatarBg: '#e0ddd8', name: 'yerin_sake', desc: 'Exploring the world of Sake', badges: ['Sake Lover'], gradient: '#e8e4d8' },
];

const achievements = [
  { avatar: 'MJ', avatarBg: '#f0e8dd', name: 'wine_master_mj', text: 'World Traveler', detail: '10 countries collected', time: '2h', color: '#c9a84c' },
  { avatar: 'TK', avatarBg: '#d4c5e2', name: 'tokyo_whisky', text: 'Whisky Explorer', detail: '10 whiskies collected', time: '5h', color: '#c9a84c' },
  { avatar: 'HJ', avatarBg: '#e0ddd8', name: 'hajin_wine', text: 'Burgundy Lover', detail: '5 Burgundy wines', time: 'Yesterday', color: '#c9a84c' },
];

export default function ExploreScreen() {
  const { user } = useAuth();
  const [drinks, setDrinks] = useState<any[]>([]);
  const [myCollection, setMyCollection] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [showSearch, setShowSearch] = useState(false);

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
        <Pressable style={styles.headerBtn} onPress={() => setShowSearch(!showSearch)}>
          <Svg width={22} height={22} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
            <Circle cx={11} cy={11} r={8} />
            <Line x1={21} y1={21} x2={16.65} y2={16.65} />
          </Svg>
        </Pressable>
      </View>

      {showSearch ? (
        <View style={{ flex: 1 }}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search wines, whisky, sake..."
              placeholderTextColor="#bbb"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>
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
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Featured Caves</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 4 }}>
            {featuredCaves.map((cave, i) => (
              <Pressable key={i} style={styles.featuredCard}>
                <View style={[styles.featuredBg, { backgroundColor: cave.gradient }]} />
                <View style={styles.featuredOverlay}>
                  <View style={[styles.featuredAvatar, { backgroundColor: cave.avatarBg }]}>
                    <Text style={styles.featuredAvatarText}>{cave.avatar}</Text>
                  </View>
                  <Text style={styles.featuredName}>{cave.name}</Text>
                  <Text style={styles.featuredDesc}>{cave.desc}</Text>
                  <View style={styles.featuredBadges}>
                    {cave.badges.map((b, j) => (
                      <View key={j} style={styles.featuredBadge}><Text style={styles.featuredBadgeText}>{b}</Text></View>
                    ))}
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Recent Achievements</Text>
          {achievements.map((a, i) => (
            <View key={i} style={styles.achievementCard}>
              <View style={styles.achievementHeader}>
                <View style={[styles.achievementAvatar, { backgroundColor: a.avatarBg }]}>
                  <Text style={styles.achievementAvatarText}>{a.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.achievementName}>{a.name}</Text>
                  <Text style={styles.achievementText}>{a.text} achieved</Text>
                </View>
              </View>
              <View style={styles.trophyRow}>
                <View style={[styles.trophyVisual, { borderColor: a.color }]}>
                  <Svg width={24} height={24} fill="none" stroke={a.color} strokeWidth={1.5} viewBox="0 0 24 24">
                    <Path d="M6 9H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3M18 9h3a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3M6 4h12v6a6 6 0 0 1-12 0V4zM12 16v3M8 22h8M10 19h4" />
                  </Svg>
                  <Text style={[styles.trophyLabel, { color: a.color }]}>{a.text}</Text>
                </View>
                <Text style={styles.trophyDetail}>{a.detail}</Text>
              </View>
              <Text style={styles.achievementTime}>{a.time}</Text>
            </View>
          ))}
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
  headerBtn: { position: 'absolute', right: 20, top: 62 },

  searchBox: { margin: 12, marginHorizontal: 16 },
  searchInput: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 10, paddingLeft: 16, fontSize: 14 },
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
  featuredCard: { width: CARD_WIDTH, height: 240, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  featuredBg: { width: '100%', height: '100%' },
  featuredOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.35)' },
  featuredAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', marginBottom: 6 },
  featuredAvatarText: { fontSize: 12, fontWeight: '600', color: '#888' },
  featuredName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  featuredDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  featuredBadges: { flexDirection: 'row', gap: 4, marginTop: 6 },
  featuredBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  featuredBadgeText: { fontSize: 10, fontWeight: '600', color: '#fff' },

  achievementCard: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#efefef' },
  achievementHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  achievementAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  achievementAvatarText: { fontSize: 12, fontWeight: '600', color: '#888' },
  achievementName: { fontSize: 14, fontWeight: '600', color: '#222' },
  achievementText: { fontSize: 13, color: '#666', marginTop: 2 },
  trophyRow: { backgroundColor: '#fafaf8', borderRadius: 12, padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trophyVisual: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5, borderRadius: 10, backgroundColor: '#fff' },
  trophyLabel: { fontSize: 13, fontWeight: '700' },
  trophyDetail: { fontSize: 12, color: '#999' },
  achievementTime: { fontSize: 11, color: '#bbb', marginTop: 8 },
});
