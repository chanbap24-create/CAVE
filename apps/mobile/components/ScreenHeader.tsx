import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polyline } from 'react-native-svg';

type Variant = 'row' | 'centered';

interface Props {
  title: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
}

export function ScreenHeader({ title, left, right, variant = 'row', style }: Props) {
  const insets = useSafeAreaInsets();
  const basePad: ViewStyle = {
    paddingTop: insets.top + 10,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#efefef',
    backgroundColor: '#fff',
  };

  const titleNode = typeof title === 'string'
    ? <Text style={styles.title}>{title}</Text>
    : title;

  if (variant === 'centered') {
    return (
      <View style={[basePad, styles.centered, style]}>
        {titleNode}
        {left ? <View style={styles.absoluteLeft}>{left}</View> : null}
        {right ? <View style={styles.absoluteRight}>{right}</View> : null}
      </View>
    );
  }

  return (
    <View style={[basePad, styles.row, style]}>
      <View style={styles.leftSlot}>{left}</View>
      <View style={styles.titleWrap}>{titleNode}</View>
      <View style={styles.rightSlot}>{right}</View>
    </View>
  );
}

export function BackButton({ onPress, fallbackPath }: { onPress?: () => void; fallbackPath?: string }) {
  const router = useRouter();
  const handlePress = onPress ?? (() => {
    if (router.canGoBack()) router.back();
    else if (fallbackPath) router.replace(fallbackPath as any);
  });
  return (
    <Pressable onPress={handlePress} style={styles.backBtn} hitSlop={8}>
      <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
        <Polyline points="15 18 9 12 15 6" />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  leftSlot: { minWidth: 32, alignItems: 'flex-start' },
  rightSlot: { minWidth: 32, alignItems: 'flex-end' },
  titleWrap: { flex: 1, alignItems: 'center' },
  centered: { alignItems: 'center', position: 'relative' },
  title: { fontSize: 17, fontWeight: '700', color: '#222' },
  absoluteLeft: { position: 'absolute', left: 20, bottom: 10 },
  absoluteRight: { position: 'absolute', right: 20, bottom: 10 },
  backBtn: { padding: 4 },
});
