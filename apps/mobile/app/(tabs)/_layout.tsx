import React, { useCallback } from 'react';
import { Tabs, useFocusEffect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { useUnreadDM } from '@/lib/hooks/useUnreadDM';
import { useUnreadGathering } from '@/lib/hooks/useUnreadGathering';
import { useUnreadCellarSocial } from '@/lib/hooks/useUnreadCellarSocial';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';

// ───── 공통 spec ─────
const ICON = 26;
const stroke = (focused: boolean) => focused ? '#222' : '#999';
const strokeW = (focused: boolean) => focused ? 2.2 : 1.8;

function HomeIcon({ focused }: { focused: boolean }) {
  // 집(지붕+벽) — explore 가 가운데 "홈" 자리.
  return (
    <Svg width={ICON} height={ICON} fill="none" stroke={stroke(focused)} strokeWidth={strokeW(focused)} viewBox="0 0 24 24">
      <Path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Path d="M9 22V12h6v10" />
    </Svg>
  );
}

function CatalogIcon({ focused }: { focused: boolean }) {
  // 펼친 책 — 주류 카탈로그 정체성 ("와인 백과/도감" 정서).
  return (
    <Svg width={ICON} height={ICON} fill="none" stroke={stroke(focused)} strokeWidth={strokeW(focused)} viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round">
      {/* 책등 (가운데 세로선) */}
      <Line x1={12} y1={5} x2={12} y2={20} />
      {/* 왼쪽 페이지 */}
      <Path d="M12 5C10 4 7 3.5 4 4v15c3-.5 6 0 8 1" />
      {/* 오른쪽 페이지 */}
      <Path d="M12 5c2-1 5-1.5 8-1v15c-3-.5-6 0-8 1" />
    </Svg>
  );
}

function SearchIcon({ focused, hasUnread }: { focused: boolean; hasUnread: boolean }) {
  // 돋보기 — 모임 탐색/검색 정서.
  return (
    <View>
      <Svg width={ICON} height={ICON} fill="none" stroke={stroke(focused)} strokeWidth={strokeW(focused)} viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round">
        <Circle cx={11} cy={11} r={8} />
        <Line x1={21} y1={21} x2={16.65} y2={16.65} />
      </Svg>
      {hasUnread && <View style={styles.unreadDot} />}
    </View>
  );
}

function ReviewsIcon({ focused }: { focused: boolean }) {
  // 연필 — 시음 후기 (적는 행위가 곧 본질).
  return (
    <Svg width={ICON} height={ICON} fill="none" stroke={stroke(focused)} strokeWidth={strokeW(focused)} viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round">
      {/* 연필 몸통 */}
      <Path d="M16 3l5 5L8 21H3v-5z" />
      {/* 지우개 / 촉 분리선 */}
      <Line x1={14} y1={5} x2={19} y2={10} />
    </Svg>
  );
}

function ProfileIcon({ focused }: { focused: boolean }) {
  return (
    <Svg width={ICON} height={ICON} fill="none" stroke={stroke(focused)} strokeWidth={strokeW(focused)} viewBox="0 0 24 24">
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
      // profile 이 첫 진입점 (2026-05-13 통합 — 셀러 컨텐츠가 profile 로 흡수됨).
      initialRouteName="profile"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      {/* 셀러 — profile 로 통합 (2026-05-13). 라우트는 deep-link 호환 위해 유지. */}
      <Tabs.Screen name="cellar" options={{ href: null }} />

      {/*
        탭 순서 (2026-05-13 재배치):
          1 (왼쪽)   wines       — 와인 병
          2          gatherings  — cheers
          3 (중앙)   explore     — 홈
          4          reviews     — 별+잔
          5 (오른쪽) profile     — 사람
      */}
      <Tabs.Screen
        name="wines"
        options={{
          tabBarIcon: ({ focused }) => <CatalogIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="gatherings"
        options={{
          tabBarIcon: ({ focused }) => <SearchIcon focused={focused} hasUnread={hasUnreadGathering} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => <HomeIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          tabBarIcon: ({ focused }) => <ReviewsIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
        }}
      />
      {/* 메시지 — 탭에서 제거됨, 프로필 헤더 종이비행기 아이콘에서 진입. */}
      <Tabs.Screen name="messages" options={{ href: null }} />
      {/* index: 호환용 라우트. 탭 미노출. */}
      <Tabs.Screen name="index" options={{ href: null }} />
      {/* create: 라벨 스캔이 cellar 헤더 + 버튼으로 이동 — 별도 탭 불필요. */}
      <Tabs.Screen name="create" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopColor: '#efefef',
    borderTopWidth: 1,
    height: 85,
    paddingTop: 8,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ed4956',
  },
});
