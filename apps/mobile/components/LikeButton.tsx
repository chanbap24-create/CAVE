import React from 'react';
import { Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLike } from '@/lib/hooks/useLike';

interface Props {
  postId: number;
  initialCount: number;
}

export function LikeButton({ postId, initialCount }: Props) {
  const { liked, toggleLike } = useLike(postId, initialCount);

  return (
    <Pressable onPress={toggleLike}>
      <Svg
        width={24}
        height={24}
        fill={liked ? '#ed4956' : 'none'}
        stroke={liked ? '#ed4956' : '#222'}
        strokeWidth={liked ? 0 : 1.8}
        viewBox="0 0 24 24"
      >
        <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </Svg>
    </Pressable>
  );
}
