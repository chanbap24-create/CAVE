import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { UserGathering } from '@/lib/hooks/useUserGatherings';

interface Props {
  gatherings: UserGathering[];
}

/**
 * 셀러 화면 상단의 "다음 모임 알림" 카드.
 *  - 사용자가 host/member 로 속한 모임 중 가장 가까운 미래 모임 1건을 D-day 와 함께 노출
 *  - 빈 상태: Discover 로 유도하는 가벼운 CTA
 *
 * 액션 우선 — 셀러 페이지 진입 즉시 "다음 일정"이 눈에 들어와야 함.
 * docs/icave_concept_updates.md §2 셀러 흡수 요소 #2 항목.
 */
export function NextGatheringCard({ gatherings }: Props) {
  const router = useRouter();
  const next = useMemo(() => pickNext(gatherings), [gatherings]);

  if (!next) {
    return (
      <Pressable style={styles.empty} onPress={() => router.push('/(tabs)/explore')}>
        <Ionicons name="wine-outline" size={20} color="#7b2d4e" />
        <Text style={styles.emptyText}>다음 모임이 없어요. Discover에서 모임 둘러보기 →</Text>
      </Pressable>
    );
  }

  const dday = formatDday(next.gathering_date);
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/gathering/${next.id}` as any)}
    >
      <View style={styles.dayWrap}>
        <Text style={styles.dayLabel}>{dday.label}</Text>
        {dday.sub ? <Text style={styles.daySub}>{dday.sub}</Text> : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{next.title}</Text>
        {next.location ? (
          <Text style={styles.location} numberOfLines={1}>📍 {next.location}</Text>
        ) : null}
        <Text style={styles.role}>{next.role === 'host' ? '내가 호스팅' : '참여 예정'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </Pressable>
  );
}

function pickNext(list: UserGathering[]): UserGathering | null {
  const now = Date.now();
  const future = list.filter(g => g.gathering_date && new Date(g.gathering_date).getTime() >= now);
  if (future.length === 0) return null;
  future.sort((a, b) =>
    new Date(a.gathering_date!).getTime() - new Date(b.gathering_date!).getTime(),
  );
  return future[0];
}

function formatDday(iso: string | null): { label: string; sub?: string } {
  if (!iso) return { label: '-' };
  const target = new Date(iso);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return { label: 'D-DAY', sub: timeOf(target) };
  if (diffDays === 1) return { label: '내일', sub: timeOf(target) };
  if (diffDays < 7) return { label: `D-${diffDays}`, sub: weekdayOf(target) };
  return { label: `D-${diffDays}`, sub: monthDayOf(target) };
}

function timeOf(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? '오전' : '오후';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${hh}:${String(m).padStart(2, '0')}`;
}
function weekdayOf(d: Date) {
  return ['일', '월', '화', '수', '목', '금', '토'][d.getDay()] + '요일';
}
function monthDayOf(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fdf6f8',
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#f0d8e0',
  },
  dayWrap: {
    width: 64, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 6, marginRight: 12,
    borderRightWidth: 1, borderRightColor: '#f0d8e0',
  },
  dayLabel: { fontSize: 16, fontWeight: '700', color: '#7b2d4e' },
  daySub: { fontSize: 11, color: '#9c5b73', marginTop: 2 },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#222' },
  location: { fontSize: 12, color: '#666', marginTop: 4 },
  role: { fontSize: 11, color: '#7b2d4e', marginTop: 4, fontWeight: '500' },

  empty: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fafafa',
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
  },
  emptyText: { fontSize: 13, color: '#666', flex: 1 },
});
