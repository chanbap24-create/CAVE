import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { PartnerBadge } from '@/components/PartnerBadge';
import { timeAgo } from '@/lib/utils/dateUtils';
import type { CommunityReview } from '@/lib/hooks/useCommunityReviews';

interface Props {
  reviews: CommunityReview[];
}

/**
 * 프로필 화면 "사람들의 시음 후기" 피드. 프로필 진입점에서 친구/커뮤니티의
 * 콘텐츠를 한 화면에 한꺼번에 보게 하는 슬롯.
 *
 * 한 항목 = 한 코멘트. 작성자 + 와인명 + (있으면) 사진 + 코멘트 본문 + 시간.
 * 와인 셀러 컬렉션 페이지로 이동.
 */
export function CommunityReviewFeed({ reviews }: Props) {
  const router = useRouter();
  if (reviews.length === 0) return null;
  return (
    <View style={styles.wrap}>
      {reviews.map(r => (
        <Pressable
          key={r.id}
          style={styles.row}
          onPress={() => r.collection ? router.push(`/wine/${r.collection.id}` as any) : null}
        >
          <View style={styles.left}>
            {r.author?.avatar_url ? (
              <Image source={r.author.avatar_url} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarChar}>
                  {(r.author?.display_name || r.author?.username || '?')[0]?.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.body}>
            <View style={styles.headerRow}>
              <Text style={styles.author} numberOfLines={1}>
                {r.author?.display_name || r.author?.username || '익명'}
              </Text>
              {r.author?.is_partner ? <PartnerBadge label={r.author.partner_label} size="sm" /> : null}
              <Text style={styles.time}>· {timeAgo(r.created_at)}</Text>
            </View>
            {r.collection?.wine ? (
              <Text style={styles.wine} numberOfLines={1}>
                🍷 {r.collection.wine.name}
                {r.collection.wine.vintage_year ? ` ${r.collection.wine.vintage_year}` : ''}
              </Text>
            ) : null}
            <Text style={styles.review} numberOfLines={4}>{r.body}</Text>
          </View>

          {r.collection?.photo_url || r.collection?.wine?.image_url ? (
            <Image
              source={r.collection.photo_url || r.collection.wine?.image_url}
              style={styles.thumb}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16 },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  left: { width: 40, alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  avatarChar: { fontSize: 14, fontWeight: '700', color: '#999' },

  body: { flex: 1, minWidth: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  author: { fontSize: 13, fontWeight: '700', color: '#222' },
  time: { fontSize: 11, color: '#999' },
  wine: { fontSize: 12, color: '#7b2d4e', marginTop: 4, fontWeight: '500' },
  review: { fontSize: 13, color: '#444', lineHeight: 18, marginTop: 6 },

  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#f0eaec' },
});
