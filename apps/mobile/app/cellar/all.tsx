import React, { useCallback, useState } from 'react';
import { View, ScrollView, RefreshControl, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useCollectionSocial } from '@/lib/hooks/useCollectionSocial';
import { useCollectionPhoto } from '@/lib/hooks/useCollectionPhoto';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { CellarList } from '@/components/CellarList';
import { Body } from '@/components/Typography';
import { colors, spacing } from '@/constants/theme';
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
      .order('updated_at', { ascending: false });
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
      <ScreenHeader title="" left={<BackButton fallbackPath="/(tabs)/profile" />} />

      <View style={styles.tabRow}>
        {caveTabs.map(c => {
          const isActive = activeCat === c;
          return (
            <Pressable
              key={c}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveCat(c)}
            >
              <Body tone={isActive ? 'warm' : 'warmMuted'} style={isActive ? styles.tabTextActive : undefined}>
                {c}
              </Body>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <CellarList
          collections={filtered}
          social={social}
          onPressRow={(c) => router.push(`/wine/${c.id}?from=profile` as any)}
          onLongPressRow={openRowActions}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.cream,
  },
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.base },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.textWarm },
  tabTextActive: { fontWeight: '600' },
});
