import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { PartnerBadge } from '@/components/PartnerBadge';
import { timeAgo } from '@/lib/utils/dateUtils';
import type { TastingReview } from '@/lib/hooks/useTastingReviews';

interface Props {
  reviews: TastingReview[];
}

/** 시음 후기 피드 — 셀러 등록 시 작성한 tasting_note 한 건당 한 행. */
export function TastingReviewsFeed({ reviews }: Props) {
  const router = useRouter();
  if (reviews.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>아직 시음 후기가 없어요</Text>
        <Text style={styles.emptyDesc}>
          셀러에 와인을 추가하면서 시음 노트를 작성하면{'\n'}여기에 모입니다.
        </Text>
      </View>
    );
  }
  return (
    <View>
      {reviews.map(r => (
        <Pressable
          key={r.id}
          style={styles.row}
          onPress={() => router.push(`/wine/${r.id}` as any)}
        >
          <View style={styles.headerRow}>
            {r.owner?.avatar_url ? (
              <Image source={r.owner.avatar_url} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarChar}>
                  {(r.owner?.display_name || r.owner?.username || '?')[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.author} numberOfLines={1}>
                  {r.owner?.display_name || r.owner?.username || '익명'}
                </Text>
                {r.owner?.is_partner ? <PartnerBadge label={r.owner.partner_label} size="sm" /> : null}
              </View>
              <Text style={styles.time}>{timeAgo(r.created_at)}</Text>
            </View>
            {r.rating ? <RatingStars rating={r.rating} /> : null}
          </View>

          {r.wine ? (
            <Text style={styles.wine} numberOfLines={1}>
              🍷 {r.wine.name}
              {r.wine.vintage_year ? ` ${r.wine.vintage_year}` : ''}
            </Text>
          ) : null}

          <View style={styles.body}>
            <Text style={styles.note} numberOfLines={6}>{r.tasting_note}</Text>
            {r.photo_url || r.wine?.image_url ? (
              <Image
                source={r.photo_url || r.wine?.image_url}
                style={styles.thumb}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={[styles.star, i <= rating ? styles.starOn : styles.starOff]}>
          ★
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: { backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  avatarChar: { fontSize: 13, fontWeight: '700', color: '#999' },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  author: { fontSize: 13, fontWeight: '700', color: '#222' },
  time: { fontSize: 11, color: '#999', marginTop: 2 },

  stars: { flexDirection: 'row', gap: 1 },
  star: { fontSize: 13 },
  starOn: { color: '#f5a623' },
  starOff: { color: '#e8e8e8' },

  wine: { fontSize: 12, color: '#7b2d4e', marginTop: 8, marginLeft: 46, fontWeight: '500' },

  body: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    marginTop: 8, marginLeft: 46,
  },
  note: { flex: 1, fontSize: 13, color: '#444', lineHeight: 19 },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#f0eaec' },

  emptyWrap: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8 },
  emptyDesc: { fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 18 },
});
