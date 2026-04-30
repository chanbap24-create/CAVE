import React, { useCallback } from 'react';
import { Tabs, useFocusEffect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { useUnreadDM } from '@/lib/hooks/useUnreadDM';
import { useUnreadGathering } from '@/lib/hooks/useUnreadGathering';
import { useUnreadCellarSocial } from '@/lib/hooks/useUnreadCellarSocial';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';

function HomeIcon({ focused }: { focused: boolean }) {
  // 집(지붕+벽) — explore 탭이 "홈" 으로 자리매김 (2026-04-30 방향성 변경)
  return (
    <Svg width={26} height={26} fill="none" stroke={focused ? '#222' : '#999'} strokeWidth={focused ? 2.2 : 1.8} viewBox="0 0 24 24">
      <Path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Path d="M9 22V12h6v10" />
    </Svg>
  );
}

function SearchIcon({ focused, hasUnread = false }: { focused: boolean; hasUnread?: boolean }) {
  return (
    <View>
      <Svg width={26} height={26} fill="none" stroke={focused ? '#222' : '#999'} strokeWidth={focused ? 2.2 : 1.8} viewBox="0 0 24 24">
        <Circle cx={11} cy={11} r={8} />
        <Line x1={21} y1={21} x2={16.65} y2={16.65} />
      </Svg>
      {hasUnread && <View style={styles.unreadDot} />}
    </View>
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

function ReviewsIcon({ focused }: { focused: boolean }) {
  // 시음 노트 아이콘 — 와인 글라스 + 별 (펜 노트 아이콘 대체)
  return (
    <Svg width={26} height={26} fill="none" stroke={focused ? '#222' : '#999'} strokeWidth={focused ? 2.2 : 1.8} viewBox="0 0 24 24">
      <Path d="M8 2h8l-1 9a4 4 0 0 1-3 4 4 4 0 0 1-3-4z" />
      <Line x1={12} y1={15} x2={12} y2={22} />
      <Line x1={8} y1={22} x2={16} y2={22} />
    </Svg>
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
      // 홈(explore) 가 첫 진입점 (2026-04-30 방향성 변경 — explore 가 "홈" 으로 자리매김).
      // 로그인 후 / 콜드 부트시 가운데 홈 탭으로 시작.
      initialRouteName="explore"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      {/* 셀러 — 첫번째 탭 */}
      <Tabs.Screen
        name="cellar"
        options={{
          tabBarIcon: ({ focused }) => <CaveIcon focused={focused} hasUnread={hasUnreadCellar} />,
        }}
      />
      {/* 모임 — 돋보기(Search) 아이콘. 모임 탐색/검색 정서 강조. */}
      <Tabs.Screen
        name="gatherings"
        options={{
          tabBarIcon: ({ focused }) => <SearchIcon focused={focused} hasUnread={hasUnreadGathering} />,
        }}
      />
      {/* 홈(트레바리식 큐레이션) — 가운데, 집 모양 아이콘. */}
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => <HomeIcon focused={focused} />,
        }}
      />
      {/* 시음 후기 — 메시지 자리. 셀러 등록 시 작성한 tasting_note 가 모이는 피드 */}
      <Tabs.Screen
        name="reviews"
        options={{
          tabBarIcon: ({ focused }) => <ReviewsIcon focused={focused} />,
        }}
      />
      {/* 프로필 */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
        }}
      />
      {/* 메시지 — 탭에서 제거됨, 프로필 메뉴에서 진입. 라우트 자체는 유지 (직접 push). */}
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
