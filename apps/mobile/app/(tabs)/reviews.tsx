import React, { useCallback, useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { TastingReviewsFeed } from '@/components/TastingReviewsFeed';
import { useTastingReviews } from '@/lib/hooks/useTastingReviews';
import { H1, Caption } from '@/components/Typography';
import { colors, spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * 시음 후기 탭 — 에디토리얼 톤 (2026-05-14 redesign A).
 *
 * 헤더 ScreenHeader 제거 → 매거진식 큰 serif italic 제목 + sepia eyebrow.
 * 배경은 cream — 일반 콘텐츠 페이지가 아니라 "노트들이 모이는 공간" 정서.
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
        {/* 매거진식 표지 — Eyebrow + sans bold 타이틀 (한국식 에디토리얼) */}
        <View style={styles.cover}>
          <Caption tone="warmMuted" style={styles.eyebrow}>NOTES · {reviews.length}</Caption>
          <H1 tone="warm" style={styles.coverTitle}>시음 노트</H1>
          <Caption tone="warmMuted" style={styles.coverSub}>
            오늘 누군가 마시고 적은 한 줄
          </Caption>
        </View>

        <View style={styles.divider} />

        <TastingReviewsFeed reviews={reviews} />
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // 페이지 전체 cream — 노트북 종이 톤. 콘텐츠 영역은 background(white) 로 분리
  container: { flex: 1, backgroundColor: colors.cream },

  // ─── Cover (매거진 표지) ───
  cover: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  eyebrow: {
    letterSpacing: 2,
    marginBottom: spacing.base,
  },
  coverTitle: {
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    marginBottom: spacing.sm,
  },
  coverSub: {
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // 매거진식 hairline divider — 카드/박스 대신 선
  divider: {
    height: 1,
    backgroundColor: colors.borderStrong,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
});
