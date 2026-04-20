import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Props {
  liked: boolean;
  count: number;
  busy?: boolean;
  onPress: () => void;
  /** 'compact' for inline wine rows, 'section' for section-header usage. */
  size?: 'compact' | 'section';
  /** Hide the count number (icon only). */
  hideCount?: boolean;
}

/**
 * Reusable heart-count toggle. Prop-based — callers pass liked/count/onPress
 * from whichever hook tracks the target (useCollectionLike, useCellarLike,
 * post likes, etc.) so the same button works everywhere.
 */
export function LikeButton({
  liked, count, busy, onPress, size = 'compact', hideCount,
}: Props) {
  const iconSize = size === 'section' ? 22 : 18;
  const color = liked ? '#ed4956' : '#999';
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      hitSlop={8}
      style={[styles.wrap, busy && { opacity: 0.5 }]}
    >
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
        <Path
          d="M12 21s-7.5-4.35-9.5-9.5C1.3 8.3 3.5 5 7 5c2 0 3.5 1 5 3 1.5-2 3-3 5-3 3.5 0 5.7 3.3 4.5 6.5C19.5 16.65 12 21 12 21z"
          fill={liked ? color : 'none'}
          stroke={color}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      </Svg>
      {!hideCount && (
        <Text style={[styles.count, size === 'section' && styles.countLg, { color }]}>
          {count}
        </Text>
      )}
    </Pressable>
  );
}

// Lightweight row of multiple social stats (likes + comments).
interface StatsRowProps {
  children: React.ReactNode;
  align?: 'left' | 'right';
}
export function SocialStatsRow({ children, align = 'right' }: StatsRowProps) {
  return (
    <View style={[statsStyles.row, align === 'left' && { justifyContent: 'flex-start' }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  count: { fontSize: 12, fontWeight: '600' },
  countLg: { fontSize: 14 },
});

const statsStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'flex-end' },
});
