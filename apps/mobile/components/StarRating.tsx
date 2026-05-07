import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  /** 0.5 단위. null/0 이면 빈 별 5개. */
  rating: number | null;
  /** 기본 13 — 카드/배지 사이즈. 입력용 큰 별은 TastingNoteEditor 의 StarRow 사용. */
  size?: number;
  color?: string;
  emptyColor?: string;
  gap?: number;
}

/**
 * Read-only 별점 5개. 0.5 단위까지 표현 (rating=3.5 → 3 full + 1 half + 1 empty).
 * Ionicons star / star-half / star-outline 사용.
 */
export function StarRating({
  rating,
  size = 13,
  color = '#f5a623',
  emptyColor = '#e8e8e8',
  gap = 1,
}: Props) {
  const v = rating ?? 0;
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {[1, 2, 3, 4, 5].map(i => {
        const variant = v >= i ? 'full' : v >= i - 0.5 ? 'half' : 'empty';
        return (
          <Ionicons
            key={i}
            name={variant === 'full' ? 'star' : variant === 'half' ? 'star-half' : 'star-outline'}
            size={size}
            color={variant === 'empty' ? emptyColor : color}
          />
        );
      })}
    </View>
  );
}
