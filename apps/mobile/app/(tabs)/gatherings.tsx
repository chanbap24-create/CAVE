import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable, RefreshControl, TextInput } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Circle, Path } from 'react-native-svg';
import { useGatherings, type Gathering } from '@/lib/hooks/useGatherings';
import { GatheringCompactRow } from '@/components/GatheringCompactRow';
import { CreateGatheringSheet } from '@/components/CreateGatheringSheet';
import { CategoryChips } from '@/components/CategoryChips';
import { H2, Body, Caption, BodyBold } from '@/components/Typography';
import { HeroBanner } from '@/components/HeroBanner';
import { colors, spacing, borderRadius, fontSize } from '@/constants/theme';
import { CATEGORY_FILTERS, CATEGORY_DB_MAP } from '@/lib/constants/drinkCategories';

// Time-of-day boundary for "this week / next week / later" grouping.
// Using start-of-day comparisons avoids 11pm gatherings falling into the
// wrong bucket after midnight UTC vs local time drift.
function startOfDay(d: Date) {
  const out = new Date(d); out.setHours(0, 0, 0, 0); return out;
}
function endOfWeek(from: Date) {
  // Roll forward to end-of-Sunday (i.e. start of next Monday) local time.
  const out = startOfDay(from);
  const day = out.getDay(); // 0 = Sunday
  const offsetToNextMon = day === 0 ? 1 : 8 - day;
  out.setDate(out.getDate() + offsetToNextMon);
  return out;
}

interface Section {
  key: string;
  label: string;
  items: Gathering[];
}

function groupByDate(gatherings: Gathering[]): Section[] {
  const now = new Date();
  const thisWeekEnd = endOfWeek(now);
  const nextWeekEnd = new Date(thisWeekEnd); nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

  const past: Gathering[] = [];
  const thisWeek: Gathering[] = [];
  const nextWeek: Gathering[] = [];
  const later: Gathering[] = [];
  const undated: Gathering[] = [];

  for (const g of gatherings) {
    if (!g.gathering_date) { undated.push(g); continue; }
    const d = new Date(g.gathering_date);
    if (d < now) past.push(g);
    else if (d < thisWeekEnd) thisWeek.push(g);
    else if (d < nextWeekEnd) nextWeek.push(g);
    else later.push(g);
  }

  const out: Section[] = [];
  if (thisWeek.length) out.push({ key: 'this', label: '이번 주', items: thisWeek });
  if (nextWeek.length) out.push({ key: 'next', label: '다음 주', items: nextWeek });
  if (later.length)    out.push({ key: 'later', label: '이후', items: later });
  if (undated.length)  out.push({ key: 'undated', label: '날짜 미정', items: undated });
  if (past.length)     out.push({ key: 'past', label: '지난 모임', items: past });
  return out;
}

function matchesSearch(g: Gathering, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    (g.title ?? '').toLowerCase().includes(needle) ||
    (g.location ?? '').toLowerCase().includes(needle) ||
    (g.host?.username ?? '').toLowerCase().includes(needle) ||
    (g.host?.display_name ?? '').toLowerCase().includes(needle)
  );
}

export default function GatheringsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeCat, setActiveCat] = useState('전체');
  const categoryKey = activeCat !== '전체' ? CATEGORY_DB_MAP[activeCat] : null;
  const { gatherings, loading, loadGatherings } = useGatherings(categoryKey);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => { loadGatherings(); }, [loadGatherings])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGatherings();
    setRefreshing(false);
  };

  const sections = useMemo(() => {
    const filtered = gatherings.filter(g => matchesSearch(g, query));
    return groupByDate(filtered);
  }, [gatherings, query]);

  const hasAny = sections.some(s => s.items.length > 0);

  return (
    <View style={styles.container}>
      {/* 코랄 hero + 우상단 + 버튼 */}
      <View style={[styles.headerWrap, { paddingTop: insets.top + spacing.xs }]}>
        <HeroBanner
          title={'함께 마실\n사람을 만나요'}
          subtitle={`GATHERINGS · ${gatherings.length}`}
          tone="coral"
        />
        <Pressable onPress={() => setShowCreate(true)} hitSlop={8} style={styles.fab}>
          <Svg width={24} height={24} fill="none" stroke="#fff" strokeWidth={2.5} viewBox="0 0 24 24">
            <Line x1={12} y1={5} x2={12} y2={19} />
            <Line x1={5} y1={12} x2={19} y2={12} />
          </Svg>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Svg width={14} height={14} fill="none" stroke={colors.textMuted} strokeWidth={1.8} viewBox="0 0 24 24">
          <Circle cx={11} cy={11} r={8} />
          <Path d="M21 21l-4.35-4.35" />
        </Svg>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="제목·호스트·장소로 검색"
          placeholderTextColor={colors.textLight}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Caption tone="muted" style={styles.clear}>✕</Caption>
          </Pressable>
        ) : null}
      </View>

      <CategoryChips categories={CATEGORY_FILTERS} active={activeCat} onChange={setActiveCat} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        keyboardShouldPersistTaps="handled"
      >
        {!hasAny && !loading ? (
          <View style={styles.empty}>
            <H2 style={styles.emptyTitle}>
              {query
                ? '검색 결과가 없어요'
                : activeCat === '전체'
                  ? '아직 등록된 모임이 없어요'
                  : `${activeCat} 카테고리 모임이 없어요`}
            </H2>
            <Body tone="muted">
              {query ? '검색어를 바꿔보세요' : activeCat === '전체' ? '+ 버튼으로 새 모임을 만들어보세요' : '다른 카테고리를 보거나 모임을 만들어보세요'}
            </Body>
          </View>
        ) : (
          sections.map(section => (
            <View key={section.key}>
              <BodyBold tone="warm" style={styles.sectionHeader}>
                {section.label}  ·  <Caption tone="warmMuted">{section.items.length}</Caption>
              </BodyBold>
              {section.items.map(g => (
                <GatheringCompactRow
                  key={g.id}
                  gathering={g}
                  onPress={() => router.push(`/gathering/${g.id}`)}
                />
              ))}
            </View>
          ))
        )}
        <View style={{ height: spacing.lg }} />
      </ScrollView>

      <CreateGatheringSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadGatherings}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  headerWrap: { position: 'relative' },
  fab: {
    position: 'absolute',
    top: spacing.md, right: spacing.lg,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ─── 검색 + 카테고리 ───
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.md, marginTop: spacing.sm, marginBottom: spacing.xs,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background, // cream 위에 흰 검색바
    borderWidth: 1, borderColor: colors.borderStrong,
  },
  searchInput: {
    flex: 1, fontSize: fontSize.body, color: colors.text,
    paddingVertical: 0,
  },
  clear: { paddingHorizontal: spacing.xs },

  sectionHeader: {
    paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },

  empty: { alignItems: 'center', paddingTop: 100, gap: spacing.sm },
  emptyTitle: { marginBottom: spacing.xs },
});
