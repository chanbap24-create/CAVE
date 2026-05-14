import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { BodyBold, Caption, Eyebrow } from '@/components/Typography';
import { colors, spacing } from '@/constants/theme';
import type { UserGathering } from '@/lib/hooks/useUserGatherings';

interface Props {
  gatherings: UserGathering[];
}

/**
 * "다음 모임" 카드 — Card hero variant (cream 배경, 매거진 톤).
 *
 * 2026-05-14: Card 시스템 + Typography 마이그레이션. Eyebrow ("NEXT") +
 * 큰 제목 + meta 라인 + 우측 D-day. cream 배경 = 트레바리식 큐레이션 정서.
 */
export function NextGatheringCard({ gatherings }: Props) {
  const router = useRouter();
  const next = useMemo(() => pickNext(gatherings), [gatherings]);

  if (!next) {
    return (
      <View style={styles.emptyWrap}>
        <Card variant="row" onPress={() => router.push('/(tabs)/explore')}>
          <View style={styles.emptyRow}>
            <Ionicons name="wine-outline" size={16} color={colors.textMuted} />
            <Caption tone="muted" style={{ flex: 1 }}>다음 모임이 없어요. 둘러보기 →</Caption>
          </View>
        </Card>
      </View>
    );
  }

  const dday = formatDday(next.gathering_date);
  const meta = [
    next.gathering_date ? formatDate(next.gathering_date) : null,
    next.location ? `📍 ${next.location}` : null,
    next.role === 'host' ? '내가 호스팅' : '참여 예정',
  ].filter(Boolean).join('  ·  ');

  return (
    <View style={styles.heroWrap}>
      <Card variant="hero" onPress={() => router.push(`/gathering/${next.id}?from=profile` as any)}>
        <View style={styles.eyebrowRow}>
          <Eyebrow tone="warmMuted">Next Gathering</Eyebrow>
          <Caption tone="primary" style={styles.dday}>{dday}</Caption>
        </View>
        <BodyBold tone="warm" style={styles.title} numberOfLines={1}>{next.title}</BodyBold>
        <Caption tone="warmMuted" numberOfLines={1}>{meta}</Caption>
      </Card>
    </View>
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
  heroWrap: { paddingHorizontal: spacing.md, marginTop: spacing.base },
  emptyWrap: { paddingHorizontal: spacing.md, marginTop: spacing.base },
  eyebrowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dday: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 16, marginTop: spacing.xs, marginBottom: 2 },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
