import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StarRating } from '@/components/StarRating';
import { TasteProfile } from '@/components/TasteProfile';
import type { WineAggregate } from '@/lib/hooks/useWineCatalog';

interface Props {
  aggregate: WineAggregate;
}

/**
 * 와인 카탈로그 페이지의 "평균 평가" 블록.
 * 평균 별점 + 평균 taste profile + 응답 수.
 *
 * 데이터가 전혀 없으면 안내 문구 노출.
 */
export function WineTasteAggregate({ aggregate }: Props) {
  const noData =
    aggregate.rating == null && aggregate.profile_count === 0;

  if (noData) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.heading}>커뮤니티 평가</Text>
        <Text style={styles.empty}>
          아직 평가가 없어요. 첫 시음 노트의 주인공이 되어보세요.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>커뮤니티 평가</Text>
      <Text style={styles.meta}>
        {aggregate.rating_count > 0 && `별점 ${aggregate.rating_count}개`}
        {aggregate.rating_count > 0 && aggregate.profile_count > 0 && ' · '}
        {aggregate.profile_count > 0 && `프로파일 ${aggregate.profile_count}개`}
      </Text>

      {aggregate.rating != null && (
        <View style={styles.starWrap}>
          <StarRating rating={aggregate.rating} size={22} gap={2} />
          <Text style={styles.ratingText}>{aggregate.rating.toFixed(1)}</Text>
        </View>
      )}

      <TasteProfile value={aggregate.profile} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  heading: {
    fontSize: 13, fontWeight: '700', color: '#222',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 4,
  },
  meta: { fontSize: 11, color: '#999', marginBottom: 12 },
  starWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  ratingText: { fontSize: 16, fontWeight: '700', color: '#222' },
  empty: { fontSize: 13, color: '#999', fontStyle: 'italic', marginTop: 4 },
});
