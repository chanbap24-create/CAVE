import React, { useCallback } from 'react';
import { Tabs, useFocusEffect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { useUnreadDM } from '@/lib/hooks/useUnreadDM';
import { useUnreadGathering } from '@/lib/hooks/useUnreadGathering';
import { useUnreadCellarSocial } from '@/lib/hooks/useUnreadCellarSocial';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';

// HomeIcon 제거됨 — index 탭이 더 이상 표시되지 않음 (cellar 가 첫 진입점)

function SearchIcon({ focused }: { focused: boolean }) {
  return (
    <Svg width={26} height={26} fill="none" stroke={focused ? '#222' : '#999'} strokeWidth={focused ? 2.2 : 1.8} viewBox="0 0 24 24">
      <Circle cx={11} cy={11} r={8} />
      <Line x1={21} y1={21} x2={16.65} y2={16.65} />
    </Svg>
  );
}

function CreateIcon({ focused }: { focused: boolean }) {
  return (
    <Svg width={26} height={26} fill="none" stroke={focused ? '#222' : '#999'} strokeWidth={focused ? 2.2 : 1.8} viewBox="0 0 24 24">
      <Rect x={3} y={3} width={18} height={18} rx={3} />
      <Line x1={12} y1={8} x2={12} y2={16} />
      <Line x1={8} y1={12} x2={16} y2={12} />
    </Svg>
  );
}

function MessageIcon({ focused, hasUnread }: { focused: boolean; hasUnread: boolean }) {
  return (
    <View>
      <Svg width={26} height={26} fill="none" stroke={focused ? '#222' : '#999'} strokeWidth={focused ? 2.2 : 1.8} viewBox="0 0 24 24">
        <Path d="M22 2L11 13" />
        <Path d="M22 2L15 22L11 13L2 9L22 2Z" />
      </Svg>
      {hasUnread && <View style={styles.unreadDot} />}
    </View>
  );
}

function CaveIcon({ focused, hasUnread }: { focused: boolean; hasUnread: boolean }) {
  return (
    <View>
      <Svg width={26} height={26} fill="none" stroke={focused ? '#222' : '#999'} strokeWidth={focused ? 2.2 : 1.8} viewBox="0 0 24 24">
        <Path d="M3 22V12a9 9 0 0 1 18 0v10" />
        <Path d="M7 22v-6a5 5 0 0 1 10 0v6" />
        <Line x1={2} y1={22} x2={22} y2={22} />
      </Svg>
      {hasUnread && <View style={styles.unreadDot} />}
    </View>
  );
}

function GatheringsIcon({ focused, hasUnread }: { focused: boolean; hasUnread: boolean }) {
  return (
    <View>
      <Svg width={26} height={26} fill="none" stroke={focused ? '#222' : '#999'} strokeWidth={focused ? 2.2 : 1.8} viewBox="0 0 24 24">
        <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <Circle cx={9} cy={7} r={4} />
        <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </Svg>
      {hasUnread && <View style={styles.unreadDot} />}
    </View>
  );
}

function ProfileIcon({ focused }: { focused: boolean }) {
  return (
    <Svg width={26} height={26} fill="none" stroke={focused ? '#222' : '#999'} strokeWidth={focused ? 2.2 : 1.8} viewBox="0 0 24 24">
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
      // i cave: 셀러가 첫 진입점 (홈 피드 제거됨, 2026-04-29 방향성 변경).
      initialRouteName="cellar"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      {/* 셀러 (홈 흡수) */}
      <Tabs.Screen
        name="cellar"
        options={{
          tabBarIcon: ({ focused }) => <CaveIcon focused={focused} hasUnread={hasUnreadCellar} />,
        }}
      />
      {/* Discover (트레바리식 큐레이션) */}
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => <SearchIcon focused={focused} />,
        }}
      />
      {/* 모임 */}
      <Tabs.Screen
        name="gatherings"
        options={{
          tabBarIcon: ({ focused }) => <GatheringsIcon focused={focused} hasUnread={hasUnreadGathering} />,
        }}
      />
      {/* 메시지 — 탭에서 제거됨, 프로필 메뉴에서 진입. 라우트 자체는 유지 (직접 push). */}
      <Tabs.Screen name="messages" options={{ href: null }} />
      {/* 프로필 */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
        }}
      />
      {/* index: 호환용 라우트 (피드 제거 — 셀러로 redirect). 탭 미노출. */}
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
