import React, { useCallback, useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TastingReviewsFeed } from '@/components/TastingReviewsFeed';
import { useTastingReviews } from '@/lib/hooks/useTastingReviews';
import { colors, spacing } from '@/constants/theme';

/**
 * 시음 후기 탭 — 표지 모두 제거 (2026-05-14).
 * cream 배경 위에 노트만 흐름. 페이지 정체성은 탭 아이콘이 담당.
 */
export default function ReviewsScreen() {
  const insets = useSafeAreaInsets();
  const { reviews, refresh } = useTastingReviews();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + spacing.md }}
      >
        <TastingReviewsFeed reviews={reviews} />
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
});
