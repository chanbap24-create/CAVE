import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * 홈 화면 캐러셀과 첫 섹션 사이의 quick action 그리드.
 *
 * 5×2 = 10개 가시. 페이징 슬라이드로 다음 페이지의 추가 항목 노출.
 * 데일리샷/배민 같은 "서비스 트레이" 패턴 — 와인·셀러 도메인에 맞게 재구성.
 *
 * 액션 데이터는 ACTIONS 상수. 각 항목은 onPress 가 placeholder (Alert) 인데,
 * 실제 라우팅은 후속 작업에서 채움.
 */

const SCREEN = Dimensions.get('window').width;
const COLS = 5;
const ROWS = 2;
const PAGE_SIZE = COLS * ROWS;
const H_PAD = 16;

interface Action {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  onPress?: () => void;
}

const ACTIONS: Action[] = [
  { key: 'best',         label: '베스트',     icon: 'flame-outline',         bg: '#ed6363' },
  { key: 'monthly',      label: '이달의 모임', icon: 'calendar-outline',      bg: '#7b2d4e' },
  { key: 'coupon',       label: '쿠폰',       icon: 'pricetag-outline',      bg: '#d4a043' },
  { key: 'ai',           label: 'AI 추천',    icon: 'sparkles-outline',      bg: '#5a7eaa' },
  { key: 'first',        label: '첫 모임',    icon: 'gift-outline',          bg: '#2c8a6e' },

  { key: 'partner',      label: '파트너샵',   icon: 'storefront-outline',    bg: '#6b4226' },
  { key: 'scan',         label: '라벨 스캔',  icon: 'camera-outline',        bg: '#3a3a3a' },
  { key: 'club',         label: '시즌 클럽',  icon: 'wine-outline',          bg: '#7b2d4e' },
  { key: 'group',        label: '공동구매',   icon: 'people-outline',        bg: '#bb6b3a' },
  { key: 'event',        label: '이벤트',     icon: 'megaphone-outline',     bg: '#d4634a' },

  { key: 'pairing',      label: '페어링',     icon: 'restaurant-outline',    bg: '#8b6a3f' },
  { key: 'guide',        label: '와인 가이드', icon: 'book-outline',          bg: '#3d4a1f' },
];

interface Props {
  onPressAction?: (key: string) => void;
}

// ACTIONS 는 모듈 상수라 페이지 슬라이스도 모듈 상수로 한 번에 계산.
// 컴포넌트 매 렌더 재계산을 막아 매번 새 배열 생성으로 인한 children reconciliation 회피.
const PAGES: Action[][] = (() => {
  const out: Action[][] = [];
  for (let i = 0; i < ACTIONS.length; i += PAGE_SIZE) {
    out.push(ACTIONS.slice(i, i + PAGE_SIZE));
  }
  return out;
})();
const TOTAL_PAGES = PAGES.length;

export function HomeQuickActionsGrid({ onPressAction }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  // 페이지 width = 화면 폭. pagingEnabled 와 정확히 매칭.
  const pageWidth = SCREEN;

  // onScroll(60fps) 대신 onMomentumScrollEnd(페이지 전환당 1회) — setState 빈도
  // 1/16ms 에서 페이지 전환당 1회로 떨어짐.
  const handleMomentumEnd = useCallback((e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    setPage(prev => (prev === idx ? prev : idx));
  }, [pageWidth]);

  const handleAction = useCallback((action: Action) => {
    if (onPressAction) onPressAction(action.key);
    else if (action.onPress) action.onPress();
    else Alert.alert(action.label, '곧 만나요');
  }, [onPressAction]);

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
      >
        {PAGES.map((pageActions, pageIdx) => (
          <View key={pageIdx} style={[styles.page, { width: pageWidth }]}>
            {pageActions.map(action => (
              <Pressable
                key={action.key}
                style={styles.cell}
                onPress={() => handleAction(action)}
              >
                <View style={[styles.iconWrap, { backgroundColor: action.bg }]}>
                  <Ionicons name={action.icon} size={22} color="#fff" />
                </View>
                <Text style={styles.label} numberOfLines={1}>{action.label}</Text>
              </Pressable>
            ))}
            {/* 마지막 페이지 빈 칸 채우기 — 그리드 정렬 유지 */}
            {pageActions.length < PAGE_SIZE &&
              Array.from({ length: PAGE_SIZE - pageActions.length }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.cellEmpty} />
              ))}
          </View>
        ))}
      </ScrollView>

      {TOTAL_PAGES > 1 && (
        <View style={styles.dots}>
          {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const cellWidth = (SCREEN - H_PAD * 2) / COLS;

const styles = StyleSheet.create({
  wrap: { paddingTop: 16, paddingBottom: 8 },
  page: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: H_PAD,
  },
  cell: {
    width: cellWidth,
    alignItems: 'center', justifyContent: 'flex-start',
    paddingVertical: 8,
  },
  cellEmpty: { width: cellWidth, height: 78 },
  iconWrap: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  label: { fontSize: 11, color: '#444', fontWeight: '600', textAlign: 'center' },

  dots: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 4, marginTop: 8,
  },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#dcdcdc' },
  dotActive: { width: 14, backgroundColor: '#7b2d4e' },
});
