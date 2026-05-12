import React, { useCallback } from 'react';
import { Tabs, useFocusEffect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { useUnreadDM } from '@/lib/hooks/useUnreadDM';
import { useUnreadGathering } from '@/lib/hooks/useUnreadGathering';
import { useUnreadCellarSocial } from '@/lib/hooks/useUnreadCellarSocial';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';

/**
 * CAVE 5-tab IA v2 ─ 셀러 / 모임 / + / 샵 / 프로필
 *
 * • cellar    — 홈 역할까지 흡수한 첫 진입점
 * • gatherings — 시즌 클럽 · 시음회 · 유저모임 (상단 탭으로 큐레이션 강도 전환)
 * • create    — 라벨 스캔 (가운데 floating, wine 컬러 강조)
 * • wines     — "샵" 으로 재해석. 파트너 매장 + 영수증 인증 진입점
 * • profile   — 진정성 점수 + 활동 + 쿠폰·포인트·제휴혜택 통합
 *
 * 숨김 라우트 — explore / reviews / messages / index 는 직접 push 로만 진입.
 */

// ── icon helpers ─────────────────────────────────────
const ICON_ACTIVE = colors.text;       // '#2a3038'
const ICON_INACTIVE = colors.textMuted; // '#868b94'

function CellarIcon({ focused, hasUnread }: { focused: boolean; hasUnread: boolean }) {
  return (
    <View>
      <Svg width={26} height={26} fill="none" stroke={focused ? ICON_ACTIVE : ICON_INACTIVE} strokeWidth={focused ? 2.2 : 1.8} viewBox="0 0 24 24">
        <Path d="M3 22V12a9 9 0 0 1 18 0v10" />
        <Path d="M7 22v-6a5 5 0 0 1 10 0v6" />
        <Line x1={2} y1={22} x2={22} y2={22} />
      </Svg>
      {hasUnread && <View style={styles.unreadDot} />}
    </View>
  );
}

function GatheringIcon({ focused, hasUnread }: { focused: boolean; hasUnread: boolean }) {
  // 시즌 클럽 모임 — 두 사람 + 잔
  return (
    <View>
      <Svg width={26} height={26} fill="none" stroke={focused ? ICON_ACTIVE : ICON_INACTIVE} strokeWidth={focused ? 2.2 : 1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <Circle cx={9} cy={7} r={4} />
        <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </Svg>
      {hasUnread && <View style={styles.unreadDot} />}
    </View>
  );
}

function ScanFab({ focused }: { focused: boolean }) {
  // 라벨 스캔 — 중앙 floating, wine 강조
  return (
    <View style={styles.fab}>
      <Svg width={24} height={24} fill="none" stroke="#fff" strokeWidth={2.2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <Path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <Path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <Path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <Line x1={7} y1={12} x2={17} y2={12} />
      </Svg>
    </View>
  );
}

function ShopIcon({ focused }: { focused: boolean }) {
  // 샵 — 까브드뱅 등 파트너 매장 + 영수증 인증
  return (
    <Svg width={26} height={26} fill="none" stroke={focused ? ICON_ACTIVE : ICON_INACTIVE} strokeWidth={focused ? 2.2 : 1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 8h16l-1.4 12.2A2 2 0 0 1 16.6 22H7.4a2 2 0 0 1-2-1.8L4 8z" />
      <Path d="M8 8V6a4 4 0 0 1 8 0v2" />
    </Svg>
  );
}

function ProfileIcon({ focused }: { focused: boolean }) {
  return (
    <Svg width={26} height={26} fill="none" stroke={focused ? ICON_ACTIVE : ICON_INACTIVE} strokeWidth={focused ? 2.2 : 1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
    </Svg>
  );
}

export default function TabLayout() {
  const { hasUnread, checkUnread } = useUnreadDM();
  const { hasUnread: hasUnreadGathering, checkUnread: checkUnreadGathering } = useUnreadGathering();
  const { hasUnread: hasUnreadCellar, checkUnread: checkUnreadCellar } = useUnreadCellarSocial();

  useFocusEffect(
    useCallback(() => {
      checkUnread();
      checkUnreadGathering();
      checkUnreadCellar();
    }, [])
  );

  return (
    <Tabs
      initialRouteName="cellar"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: ICON_ACTIVE,
        tabBarInactiveTintColor: ICON_INACTIVE,
      }}
    >
      {/* 1 셀러 */}
      <Tabs.Screen
        name="cellar"
        options={{
          title: '셀러',
          tabBarIcon: ({ focused }) => <CellarIcon focused={focused} hasUnread={hasUnreadCellar} />,
        }}
      />
      {/* 2 모임 */}
      <Tabs.Screen
        name="gatherings"
        options={{
          title: '모임',
          tabBarIcon: ({ focused }) => <GatheringIcon focused={focused} hasUnread={hasUnreadGathering} />,
        }}
      />
      {/* 3 + 라벨 스캔 (가운데 floating) */}
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <ScanFab focused={focused} />,
        }}
      />
      {/* 4 샵 — wines 라우트를 "샵" 으로 재해석 */}
      <Tabs.Screen
        name="wines"
        options={{
          title: '샵',
          tabBarIcon: ({ focused }) => <ShopIcon focused={focused} />,
        }}
      />
      {/* 5 프로필 */}
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
        }}
      />

      {/* 숨김 라우트 — 직접 push 로만 진입 */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="reviews" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 88,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary, // wine 700
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
