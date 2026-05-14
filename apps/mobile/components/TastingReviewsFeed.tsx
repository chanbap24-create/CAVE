import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { CardImage } from '@/components/CardImage';
import { useRouter } from 'expo-router';
import { PartnerBadge } from '@/components/PartnerBadge';
import { StarRating } from '@/components/StarRating';
import { BodyBold, Body, BodyLg, Caption, H2 } from '@/components/Typography';
import { colors, spacing, borderRadius, fontWeight } from '@/constants/theme';
import { timeAgo } from '@/lib/utils/dateUtils';
import type { TastingReview } from '@/lib/hooks/useTastingReviews';

interface Props {
  reviews: TastingReview[];
}

const AVATAR = 32;

/**
 * 시음 후기 피드 — 매거진식 노트북 엔트리 (2026-05-14 redesign A).
 *
 * 카드/박스 X. 큰 serif italic 와인 이름 + body 노트 + hairline divider.
 * 작성자/시간/별점은 상단 메타 한 줄로 절제.
 */
export function TastingReviewsFeed({ reviews }: Props) {
  const router = useRouter();
  if (reviews.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <BodyLg tone="warm">아직 시음 후기가 없어요</BodyLg>
        <Caption tone="warmMuted" style={styles.emptyDesc}>
          셀러에 와인을 추가하면서{'\n'}시음 노트를 작성하면 여기에 모입니다.
        </Caption>
      </View>
    );
  }
  return (
    <View>
      {reviews.map((r, idx) => (
        <Pressable
          key={r.id}
          style={styles.entry}
          onPress={() => router.push(`/wine/${r.id}?from=reviews` as any)}
        >
          {/* 메타 — 작성자 / 시간 / 별점 한 줄 */}
          <View style={styles.metaRow}>
            {r.owner?.avatar_url ? (
              <CardImage source={r.owner.avatar_url} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Caption tone="warmMuted" style={styles.avatarChar}>
                  {(r.owner?.display_name || r.owner?.username || '?')[0]?.toUpperCase()}
                </Caption>
              </View>
            )}
            <Caption tone="warm" style={styles.author} numberOfLines={1}>
              {r.owner?.display_name || r.owner?.username || '익명'}
              {r.owner?.username && r.owner?.display_name ? `  @${r.owner.username}` : ''}
            </Caption>
            {r.owner?.is_partner ? <PartnerBadge label={r.owner.partner_label} size="sm" /> : null}
            <View style={{ flex: 1 }} />
            {r.rating ? <StarRating rating={r.rating} size={12} gap={1} /> : null}
            <Caption tone="warmMuted">{timeAgo(r.created_at)}</Caption>
          </View>

          {/* 와인 이름 — sans bold 매거진 헤드라인 */}
          {r.wine ? (
            <H2 tone="warm" style={styles.wine} numberOfLines={2}>
              {r.wine.name}
              {r.wine.vintage_year ? ` · ${r.wine.vintage_year}` : ''}
            </H2>
          ) : null}

          {/* 노트 본문 + 사진 */}
          <View style={styles.body}>
            <Body tone="warm" style={styles.note} numberOfLines={5}>{r.tasting_note}</Body>
            {r.photo_url || r.wine?.image_url ? (
              <CardImage
                source={r.photo_url || r.wine?.image_url}
                style={styles.thumb}
              />
            ) : null}
          </View>

          {/* hairline divider — 마지막 항목 제외 */}
          {idx < reviews.length - 1 ? <View style={styles.divider} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // 한 엔트리 = 노트북 한 페이지의 entry 정서.
  entry: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },

  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.base,
  },
  avatar: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 },
  avatarPlaceholder: {
    backgroundColor: colors.creamDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarChar: { fontWeight: fontWeight.bold as any },
  author: {},

  // 와인 이름 — sans bold (Korean editorial 톤)
  wine: {
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.3,
    marginBottom: spacing.base,
  },

  body: {
    flexDirection: 'row',
    gap: spacing.base,
    alignItems: 'flex-start',
  },
  note: { flex: 1, lineHeight: 21 },
  thumb: {
    width: 84, height: 84,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.creamDeep,
  },

  divider: {
    height: 1,
    backgroundColor: colors.borderStrong,
    marginTop: spacing.lg,
    marginHorizontal: -spacing.md, // 카드 패딩 무시하고 풀폭
  },

  emptyWrap: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xxl,
    alignItems: 'center', gap: spacing.sm,
  },
  emptyDesc: { textAlign: 'center', lineHeight: 18 },
});
