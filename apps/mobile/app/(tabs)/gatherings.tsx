import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import Svg, { Line } from 'react-native-svg';
import { useGatherings } from '@/lib/hooks/useGatherings';
import { GatheringCard } from '@/components/GatheringCard';
import { CreateGatheringSheet } from '@/components/CreateGatheringSheet';

export default function GatheringsScreen() {
  const router = useRouter();
  const { gatherings, loading, loadGatherings } = useGatherings();
  const [showCreate, setShowCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => { loadGatherings(); }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGatherings();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.headerLeft} onPress={() => setShowCreate(true)}>
          <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
            <Line x1={12} y1={5} x2={12} y2={19} />
            <Line x1={5} y1={12} x2={19} y2={12} />
          </Svg>
        </Pressable>
        <Text style={styles.title}>Gatherings</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />}
      >
        {gatherings.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No gatherings yet</Text>
            <Text style={styles.emptyDesc}>Tap + to create one</Text>
          </View>
        ) : (
          gatherings.map(g => (
            <GatheringCard key={g.id} gathering={g} onPress={() => router.push(`/gathering/${g.id}`)} />
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      <CreateGatheringSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadGatherings}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 10, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#222' },
  headerLeft: { position: 'absolute', left: 20, bottom: 10 },

  empty: { alignItems: 'center', paddingTop: 120 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#222', marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#999' },
});
