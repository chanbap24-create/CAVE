import React, { useCallback, useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TastingReviewsFeed } from '@/components/TastingReviewsFeed';
import { HeroBanner } from '@/components/HeroBanner';
import { useTastingReviews } from '@/lib/hooks/useTastingReviews';
import { colors, spacing } from '@/constants/theme';

/**
 * 시음 후기 탭 — peach hero + 노트 흐름.
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
        contentContainerStyle={{ paddingTop: insets.top + spacing.xs }}
      >
        <HeroBanner
          title={'오늘 마신\n한 잔의 기록'}
          subtitle={`TASTING NOTES · ${reviews.length}`}
          tone="peach"
        />
        <TastingReviewsFeed reviews={reviews} />
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
