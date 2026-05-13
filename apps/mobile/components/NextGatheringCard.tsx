import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { UserGathering } from '@/lib/hooks/useUserGatherings';

interface Props {
  gatherings: UserGathering[];
}

/**
 * "다음 모임" 알림 — 평면 카드 (white bg + light border).
 *
 * 2026-05-13 단순화: 이전엔 좌측 colored block + tinted bg 였으나
 * 프로필 전반의 white 톤과 충돌. 동일한 카드 결로 통일.
 */
export function NextGatheringCard({ gatherings }: Props) {
  const router = useRouter();
  const next = useMemo(() => pickNext(gatherings), [gatherings]);

  if (!next) {
    return (
      <Pressable style={styles.empty} onPress={() => router.push('/(tabs)/explore')}>
        <Ionicons name="wine-outline" size={16} color="#999" />
        <Text style={styles.emptyText}>다음 모임이 없어요. 둘러보기 →</Text>
      </Pressable>
    );
  }

  const dday = formatDday(next.gathering_date);
  const meta = [
    next.gathering_date ? formatDate(next.gathering_date) : null,
    next.location ? `📍 ${next.location}` : null,
    next.role === 'host' ? '내가 호스팅' : '참여 예정',
  ].filter(Boolean).join(' · ');

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/gathering/${next.id}?from=profile` as any)}
    >
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{next.title}</Text>
          <Text style={styles.dday}>{dday}</Text>
        </View>
        <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#bbb" />
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

function formatDday(iso: string | null): string {
  if (!iso) return '미정';
  const target = new Date(iso);
  const diffDays = Math.ceil((target.getTime() - Date.now()) / 86400000);
  if (diffDays <= 0) return 'D-Day';
  return `D-${diffDays}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const wd = '일월화수목금토'[d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(${wd})`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#eee',
  },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 14, fontWeight: '700', color: '#222', flex: 1 },
  dday: { fontSize: 12, fontWeight: '700', color: '#7b2d4e' },
  meta: { fontSize: 11, color: '#888', marginTop: 4 },

  empty: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#eee',
  },
  emptyText: { fontSize: 12, color: '#888', flex: 1 },
});
