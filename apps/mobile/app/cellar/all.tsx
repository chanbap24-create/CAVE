import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useCollectionSocial } from '@/lib/hooks/useCollectionSocial';
import { useCollectionPhoto } from '@/lib/hooks/useCollectionPhoto';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { CellarList } from '@/components/CellarList';
import { CATEGORY_DB_MAP } from '@/lib/constants/drinkCategories';

const caveTabs = ['전체', '와인', '양주', '전통주', '기타'];
const catDbMap = CATEGORY_DB_MAP;

/**
 * 셀러 와인 전용 화면 — 셀러 탭 홈은 첫 10개만 보여주고, 전체 목록은 이 페이지로
 * 분리. 카테고리 탭 + 무한 리스트 + long-press 액션(제거) 만 제공. 다음 모임/픽
 * 등 다른 큐레이션 섹션은 없음 — 와인 관리 집중 모드.
 */
export default function CellarAllScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState('전체');
  const [refreshing, setRefreshing] = useState(false);
  const { changePhoto } = useCollectionPhoto();
  const social = useCollectionSocial(collections.map(c => c.id));

  useFocusEffect(useCallback(() => {
    if (user) loadCollections();
  }, [user]));

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

  function openRowActions(collectionId: number, hasPhoto: boolean) {
    Alert.alert('와인 액션', undefined, [
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

  return (
    <View style={styles.container}>
      <ScreenHeader
        variant="centered"
        title={`내 셀러 ${collections.length}병`}
        left={<BackButton fallbackPath="/(tabs)/cellar" />}
      />

      <View style={styles.tabRow}>
        {caveTabs.map(c => (
          <Pressable
            key={c}
            style={[styles.tab, activeCat === c && styles.tabActive]}
            onPress={() => setActiveCat(c)}
          >
            <Text style={[styles.tabText, activeCat === c && styles.tabTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <CellarList
          collections={filtered}
          social={social}
          onPressRow={(c) => router.push(`/wine/${c.id}`)}
          onLongPressRow={openRowActions}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: '#efefef',
    paddingHorizontal: 16,
  },
  tab: { paddingVertical: 10, paddingHorizontal: 14 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#222' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#bbb' },
  tabTextActive: { color: '#222', fontWeight: '600' },
});
