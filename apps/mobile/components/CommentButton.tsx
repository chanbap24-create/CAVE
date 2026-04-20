import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Props {
  count: number;
  onPress: () => void;
  size?: 'compact' | 'section';
  hideCount?: boolean;
}

/** Comment icon + count. Pairs with LikeButton in SocialStatsRow. */
export function CommentButton({ count, onPress, size = 'compact', hideCount }: Props) {
  const iconSize = size === 'section' ? 22 : 18;
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.wrap}>
      <Svg width={iconSize} height={iconSize} fill="none" stroke="#999" strokeWidth={1.8} viewBox="0 0 24 24">
        <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      {!hideCount && (
        <Text style={[styles.count, size === 'section' && styles.countLg]}>{count}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  count: { fontSize: 12, fontWeight: '600', color: '#999' },
  countLg: { fontSize: 14 },
});
