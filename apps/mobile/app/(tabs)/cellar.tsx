import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, RefreshControl } from 'react-native';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';

const bgColors: Record<string, string> = { wine: '#f0e8dd', whiskey: '#e8ddd0', sake: '#e0e8f0', cognac: '#ede5d8', other: '#e8e8e8' };
const labelMap: Record<string, string> = { wine: 'Wine', whiskey: 'Whisky', sake: 'Sake', cognac: 'Cognac', other: 'Other' };
const caveTabs = ['All', 'Wine', 'Whisky', 'Sake', 'Other'];
const catDbMap: Record<string, string> = { Wine: 'wine', Whisky: 'whiskey', Sake: 'sake', Other: 'other' };

export default function CellarScreen() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) loadCollections();
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {caveTabs.map(c => (
          <Pressable key={c} style={[styles.tab, activeCat === c && styles.tabActive]} onPress={() => setActiveCat(c)}>
            <Text style={[styles.tabText, activeCat === c && styles.tabTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Cave is empty</Text>
          <Text style={styles.emptyDesc}>Go to Discover and add drinks{'\n'}to start your collection</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />}
          contentContainerStyle={styles.grid}
        >
          {filtered.map(c => {
            const w = c.wine;
            if (!w) return null;
            return (
              <View key={c.id} style={styles.card}>
                <View style={[styles.cardImg, { backgroundColor: bgColors[w.category] || '#f0f0f0' }]} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={2}>{w.name}</Text>
                  <Text style={styles.cardMeta}>{w.region || w.country} · {labelMap[w.category] || w.category}</Text>
                  <Pressable onPress={() => removeCave(c.id)}>
                    <Text style={styles.cardRemove}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
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
    alignItems: 'center',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#222' },

  stats: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 20, marginHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '700', color: '#222' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 2, fontWeight: '500' },

  tabScroll: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: '#efefef' },
  tab: { paddingVertical: 12, paddingHorizontal: 16 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#222' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#bbb' },
  tabTextActive: { color: '#222', fontWeight: '600' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#222', marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 22 },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    padding: 14, gap: 10,
  },
  card: {
    width: '48%', backgroundColor: '#fff', borderRadius: 12,
    overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0',
  },
  cardImg: { height: 120 },
  cardBody: { padding: 10, paddingHorizontal: 12 },
  cardName: { fontSize: 13, fontWeight: '600', color: '#222', lineHeight: 17 },
  cardMeta: { fontSize: 11, color: '#999', marginTop: 3 },
  cardRemove: { fontSize: 11, color: '#ed4956', marginTop: 6, fontWeight: '500' },
});
