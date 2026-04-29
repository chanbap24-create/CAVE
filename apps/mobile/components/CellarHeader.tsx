import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from './ScreenHeader';

interface Props {
  unreadCount: number;
  onPlusPress: () => void;
}

/**
 * Cellar(홈) 헤더. 좌측 + (라벨 스캔), 우측 알림 벨(미확인 카운트 배지).
 * 홈 피드 제거 후 cellar 가 첫 진입점이라 알림 벨이 여기로 이동.
 */
export function CellarHeader({ unreadCount, onPlusPress }: Props) {
  const router = useRouter();
  return (
    <ScreenHeader
      variant="centered"
      title="My Cave"
      left={
        <Pressable onPress={onPlusPress} hitSlop={8}>
          <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
            <Line x1={12} y1={5} x2={12} y2={19} />
            <Line x1={5} y1={12} x2={19} y2={12} />
          </Svg>
        </Pressable>
      }
      right={
        <Pressable onPress={() => router.push('/notifications')} hitSlop={8}>
          <Ionicons name="notifications-outline" size={24} color="#262626" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute', top: -4, right: -6,
    backgroundColor: '#ed4956', borderRadius: 9,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
});
