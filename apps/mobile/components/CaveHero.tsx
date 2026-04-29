import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  bottles: number;
  /** 참여한 모임 횟수 (host + member 합산이든 attended 든 caller 가 결정) */
  gatherings?: number;
  /** 구매(샵 구입) 와인 수 — collections.source === 'shop_purchase' 카운트 */
  purchases?: number;
  /** 한 줄 취향 요약 — 빈 값은 필터하여 "· ·" 잔여 안 남김. */
  summary?: (string | null | undefined)[];
}

/**
 * 셀러 탭 상단 헤어로. 트래커 톤(KPI 박스)이 아닌 **여정 기록** 톤.
 *
 * 큰 serif 숫자 + 작은 단위어("병의 셀러", "번의 모임", "병 구매") 형태로 stats
 * 3개를 chip 처럼 노출. 하단에 한 줄로 취향 요약 (top category · country · region).
 *
 * 디자인 가이드: 숫자는 PlayfairDisplay (Cave 로고와 같은 폰트로 시각언어 통일),
 * 컬러는 따뜻한 sepia 계열 (트래커 톤의 검정 / 자주 strong 와 다른 결).
 */
export function CaveHero({ bottles, gatherings = 0, purchases = 0, summary }: Props) {
  const parts = (summary ?? []).filter(Boolean) as string[];
  const hasSummary = parts.length > 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.statsRow}>
        <Stat value={bottles} unit="병의 셀러" />
        <Divider />
        <Stat value={gatherings} unit="번의 모임" />
        <Divider />
        <Stat value={purchases} unit="병 구매" />
      </View>

      {hasSummary ? (
        <Text style={styles.summaryText}>{parts.join(' · ')}</Text>
      ) : (
        <Text style={styles.summaryEmpty}>와인을 추가하면 취향이 여기에 그려져요</Text>
      )}
    </View>
  );
}

function Stat({ value, unit }: { value: number; unit: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 14, paddingBottom: 16, paddingHorizontal: 20,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#efe6d4',
    marginTop: 6,
    backgroundColor: '#fcfaf6', // 따뜻한 종이 톤 (시각언어: 일기/저널)
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around',
    marginBottom: 12,
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: {
    fontSize: 28, lineHeight: 32,
    color: '#3a1e1c',
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 11, fontWeight: '600',
    color: '#7a6a55',
    marginTop: 4, letterSpacing: 0.2,
  },
  divider: {
    width: 1, height: 26, backgroundColor: '#e5dccb', marginBottom: 14,
  },

  summaryText: {
    fontSize: 13, color: '#5a4a3e',
    fontStyle: 'italic',
    textAlign: 'center', lineHeight: 19,
  },
  summaryEmpty: {
    fontSize: 12, color: '#b0a085',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
