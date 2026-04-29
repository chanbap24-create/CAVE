import React, { useCallback, useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TastingReviewsFeed } from '@/components/TastingReviewsFeed';
import { useTastingReviews } from '@/lib/hooks/useTastingReviews';

/**
 * 시음 후기 탭. 셀러에 등록하면서 작성한 tasting_note 들이 모이는 피드.
 *
 * 위치: 기존 메시지 탭 슬롯. 메시지는 프로필 메뉴에서 진입.
 * v2: follows 기반 좁힘 + 좋아요/댓글 + 무한 스크롤.
 */
export default function ReviewsScreen() {
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
      <ScreenHeader variant="centered" title="시음 후기" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />}
        showsVerticalScrollIndicator={false}
      >
        <TastingReviewsFeed reviews={reviews} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
