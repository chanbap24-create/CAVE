import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Line, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, fontFamily } from '@/constants/theme';

interface Props {
  unreadCount: number;
  onPlusPress: () => void;
  userName?: string;     // 예: "조성재"
  bottleCount?: number;  // 예: 12
}

/**
 * CAVE v2 Cellar 헤더.
 *
 * "내 셀러" 한 줄 → 다음 두 위계로 분할:
 *   (1) 상단 nav   : 좌측 알림 벨(우측 이동) / 중앙 "셀러" 라벨 / 우측 + 스캔 + 알림
 *   (2) 히어로     : Noto Serif Black 으로 "12병의 주류 우주" 하나의 한 문장
 *
 * 디자인 시스템 토큰: colors.cellar800 다크 배경 + carrot 강조 dot.
 * 모든 시각 요소가 진정성(authenticity) 누적의 "내가 마신 한 병" 을 중심에 둠.
 */
export function CellarHeader({ unreadCount, onPlusPress, userName, bottleCount }: Props) {
  const router = useRouter();
  const displayName = userName ?? '나';
  const count = bottleCount ?? 0;

  return (
    <View style={styles.wrap}>
      {/* (1) top nav row */}
      <View style={styles.navRow}>
        <Text style={styles.crumb}>셀러</Text>
        <View style={styles.navRight}>
          <Pressable onPress={onPlusPress} hitSlop={8} style={styles.navBtn}>
            <Svg width={22} height={22} fill="none" stroke="#fff" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <Path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <Path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <Path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <Line x1={7} y1={12} x2={17} y2={12} />
            </Svg>
          </Pressable>
          <Pressable onPress={() => router.push('/notifications')} hitSlop={8} style={styles.navBtn}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* (2) hero */}
      <View style={styles.heroBody}>
        <Text style={styles.userline}>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userLineMuted}> 님의 셀러</Text>
        </Text>
        <Text style={styles.bigLine}>
          {count}병의{'\n'}
          <Text style={styles.bigLineCarrot}>주류 우주</Text>
        </Text>
      </View>

      {/* (3) glow accent */}
      <View pointerEvents="none" style={styles.glow} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.cellar800,
    paddingTop: 8,
    paddingBottom: 24,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  crumb: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.2 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBody: { paddingHorizontal: 20, paddingTop: 6 },
  userline: { fontSize: 13, marginBottom: 12 },
  userName: { color: '#fff', fontWeight: '700' },
  userLineMuted: { color: 'rgba(255,255,255,0.55)' },
  bigLine: {
    color: '#fff',
    fontFamily: fontFamily.serif,
    fontWeight: '900',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  bigLineCarrot: { color: colors.carrot500 },
  glow: {
    position: 'absolute', right: -40, top: -20,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: colors.wine700, opacity: 0.35,
  },
  badge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: colors.carrot600, borderRadius: 9,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
});
