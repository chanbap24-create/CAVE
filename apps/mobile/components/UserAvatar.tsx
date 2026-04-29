import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { getAvatarRingColor } from '@/lib/tierUtils';

type Size = 'sm' | 'md' | 'lg' | 'xl';

interface Props {
  uri?: string | null;
  fallbackChar?: string;
  collectionCount?: number;
  size?: Size;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<Size, { box: number; font: number; glowPad: number }> = {
  sm: { box: 28, font: 11, glowPad: 1 },
  md: { box: 36, font: 12, glowPad: 2 },
  lg: { box: 44, font: 16, glowPad: 2 },
  xl: { box: 80, font: 28, glowPad: 2 },
};

export function UserAvatar({
  uri,
  fallbackChar,
  collectionCount = 0,
  size = 'md',
  style,
}: Props) {
  const { box, font, glowPad } = SIZES[size];
  const radius = box / 2;
  const ringColor = getAvatarRingColor(collectionCount);
  const initial = fallbackChar?.[0]?.toUpperCase() || '?';

  const borderStyle = ringColor ? { borderWidth: 2, borderColor: ringColor } : null;

  const glowStyle: ViewStyle | undefined = ringColor
    ? {
        borderRadius: radius + glowPad + 2,
        padding: glowPad,
        shadowColor: ringColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: size === 'sm' ? 5 : 6,
        elevation: 8,
      }
    : undefined;

  const content = uri ? (
    <Image
      source={uri}
      style={[{ width: box, height: box, borderRadius: radius }, borderStyle]}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={150}
    />
  ) : (
    <View
      style={[
        {
          width: box,
          height: box,
          borderRadius: radius,
          backgroundColor: '#f0f0f0',
          alignItems: 'center',
          justifyContent: 'center',
        },
        borderStyle,
      ]}
    >
      <Text style={[styles.text, { fontSize: font }]}>{initial}</Text>
    </View>
  );

  if (glowStyle) {
    return <View style={[glowStyle, style]}>{content}</View>;
  }
  return style ? <View style={style}>{content}</View> : content;
}

const styles = StyleSheet.create({
  text: { fontWeight: '600', color: '#999' },
});
