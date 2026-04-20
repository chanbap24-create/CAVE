import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Svg, { Line } from 'react-native-svg';
import { useGatherings } from '@/lib/hooks/useGatherings';
import { GatheringCard } from '@/components/GatheringCard';
import { CreateGatheringSheet } from '@/components/CreateGatheringSheet';
import { CategoryChips } from '@/components/CategoryChips';
import { ScreenHeader } from '@/components/ScreenHeader';
import { CATEGORY_FILTERS, CATEGORY_DB_MAP } from '@/lib/constants/drinkCategories';

export default function GatheringsScreen() {
  const router = useRouter();
  const [activeCat, setActiveCat] = useState('All');
  const categoryKey = activeCat !== 'All' ? CATEGORY_DB_MAP[activeCat] : null;
  const { gatherings, loading, loadGatherings } = useGatherings(categoryKey);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => { loadGatherings(); }, [loadGatherings])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGatherings();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        variant="centered"
        title="Gatherings"
        left={
          <Pressable onPress={() => setShowCreate(true)} hitSlop={8}>
            <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
              <Line x1={12} y1={5} x2={12} y2={19} />
              <Line x1={5} y1={12} x2={19} y2={12} />
            </Svg>
          </Pressable>
        }
      />

      <CategoryChips categories={CATEGORY_FILTERS} active={activeCat} onChange={setActiveCat} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />}
      >
        {gatherings.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {activeCat === 'All' ? 'No gatherings yet' : `No ${activeCat.toLowerCase()} gatherings`}
            </Text>
            <Text style={styles.emptyDesc}>
              {activeCat === 'All' ? 'Tap + to create one' : 'Try another category or create one'}
            </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  empty: { alignItems: 'center', paddingTop: 120 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#222', marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#999' },
});
