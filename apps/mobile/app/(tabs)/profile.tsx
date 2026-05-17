import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Body, BodyBold, Caption, Eyebrow, Label, H1 } from '@/components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/hooks/useProfile';
import { useTasteProfile } from '@/lib/hooks/useTasteProfile';
import { useUserBadges } from '@/lib/hooks/useUserBadges';
import { useMyPicks } from '@/lib/hooks/useMyPicks';
import { useUserGatherings } from '@/lib/hooks/useUserGatherings';
import { useRecommendedGatherings } from '@/lib/hooks/useRecommendedGatherings';
import { useRecentDrinks } from '@/lib/hooks/useRecentDrinks';
import { useFeaturedCaves } from '@/lib/hooks/useFeaturedCaves';
import { useUnreadDM } from '@/lib/hooks/useUnreadDM';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useBadgeChecker } from '@/lib/hooks/useBadgeChecker';
import { ProfileHeader } from '@/components/ProfileHeader';
import { NextGatheringCard } from '@/components/NextGatheringCard';
import { FriendsActivityRow } from '@/components/FriendsActivityRow';
import { RecommendedGatheringsRow } from '@/components/RecommendedGatheringsRow';
import { RecentlyDrunkRow } from '@/components/RecentlyDrunkRow';
import { FeaturedCaveCard } from '@/components/FeaturedCaveCard';
import { MyPicksSection } from '@/components/MyPicksSection';
import { CellarGrid, type CellarGridItem } from '@/components/CellarGrid';
import { LabelScanSheet } from '@/components/LabelScanSheet';
import { EditProfileModal } from '@/components/EditProfileModal';

type Tab = 'activity' | 'cellar' | 'gatherings' | 'reviews';

/**
 * 프로필 = 통합 홈. 셀러 탭이 폐기되고 그 활동 컨텐츠가 여기로 흡수됨.
 *
 * persistent 위 (모든 탭 공통):
 *   - ProfileHeader (아바타 / 이름 / stats)
 *   - bio + 편집/공유
 *   - CaveHero (병/모임/구매)
 *   - NextGatheringCard (다음 모임)
 *
 * Segmented tabs (4):
 *   활동 (default) — 친구 활동 + 최근 마신 + 추천 모임 + 친구 셀러 + 내 픽
 *   셀러 — 그리드
 *   모임 — 본인 참여 모임 list
 *   후기 — 본인 노트 작성한 와인 list
 *
 * 설정은 우상단 톱니 → /settings 페이지로 분리 (2026-05-13).
 */
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('activity');
  const [refreshing, setRefreshing] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showScan, setShowScan] = useState(false);

  const { taste, loadTaste } = useTasteProfile(user?.id);
  const { loadBadges } = useUserBadges(user?.id);
  const { profile, save } = useProfile(user?.id, user?.email, [loadBadges, loadTaste]);
  const { picks, loadPicks, addPick, removePick } = useMyPicks();
  const { gatherings, loadGatherings } = useUserGatherings(user?.id);
  const { recs: recommendedGatherings, loadRecs } = useRecommendedGatherings(user?.id);
  const { drinks: recentDrinks, refresh: refreshDrinks } = useRecentDrinks();
  const { caves: featuredCaves, loading: cavesLoading, refresh: refreshCaves } = useFeaturedCaves();
  const { hasUnread } = useUnreadDM();
  const { unreadCount, loadUnreadCount } = useNotifications();
  const { checkAndAwardBadges } = useBadgeChecker();

  const [collections, setCollections] = useState<CellarGridItem[]>([]);
  const [collectionCount, setCollectionCount] = useState(0);
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);

  const loadCollections = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('collections')
      .select('id, photo_url, source, wine:wines(name, image_url, category)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    const rows = (data ?? []) as any[];
    setCollections(rows as unknown as CellarGridItem[]);
    setCollectionCount(rows.length);
    setPurchaseCount(rows.filter(r => r.source === 'shop_purchase').length);
  }, [user?.id]);

  const loadReviews = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('collections')
      .select('id, tasting_note, rating, tasting_note_updated_at, wine:wines(id, name, producer, vintage_year, image_url)')
      .eq('user_id', user.id)
      .not('tasting_note', 'is', null)
      .order('tasting_note_updated_at', { ascending: false, nullsFirst: false })
      .limit(30);
    setReviews((data ?? []).filter((r: any) => r.tasting_note?.trim().length > 0));
  }, [user?.id]);

  // Persistent (헤더 / NextGathering 에 항상 필요)
  const loadCore = useCallback(() => {
    loadCollections(); loadGatherings(); loadUnreadCount(); checkAndAwardBadges();
  }, [loadCollections, loadGatherings, loadUnreadCount, checkAndAwardBadges]);

  // 탭별 데이터 — 처음 열릴 때만 1회 로드.
  const loadedTabsRef = useRef<Set<Tab>>(new Set());
  const loadActivityData = useCallback(() => {
    loadPicks(); refreshDrinks(); refreshCaves(); loadRecs();
  }, [loadPicks, refreshDrinks, refreshCaves, loadRecs]);

  // focus 캐시: 30초 이내 재 focus 면 reload skip.
  // (다른 탭 갔다 돌아올 때마다 4 fetch 호출되던 문제 — 누적 491s 차지).
  const lastFocusLoadRef = useRef(0);
  const FOCUS_CACHE_MS = 30_000;
  useFocusEffect(useCallback(() => {
    const now = Date.now();
    if (now - lastFocusLoadRef.current < FOCUS_CACHE_MS) return;
    lastFocusLoadRef.current = now;
    loadCore();
  }, [loadCore]));

  useEffect(() => {
    if (loadedTabsRef.current.has(tab)) return;
    if (tab === 'activity') loadActivityData();
    else if (tab === 'reviews') loadReviews();
    loadedTabsRef.current.add(tab);
  }, [tab, loadActivityData, loadReviews]);

  async function onRefresh() {
    setRefreshing(true);
    loadedTabsRef.current.clear();
    lastFocusLoadRef.current = Date.now();  // focus 캐시 갱신
    loadCore();
    if (tab === 'activity') loadActivityData();
    else if (tab === 'reviews') loadReviews();
    loadedTabsRef.current.add(tab);
    setTimeout(() => setRefreshing(false), 600);
  }

  const fallbackChar = profile?.display_name?.[0] || user?.email?.[0] || '?';

  function confirmSignOut() {
    Alert.alert('로그아웃', '정말 로그아웃하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: signOut },
    ]);
  }

  const displayName = profile?.display_name || profile?.username || 'Profile';

  return (
    <View style={styles.container}>
      {/* 매거진 표지 영역 — cream bg + Eyebrow + Display 타이틀. status bar 영역 인셋 적용. */}
      <View style={[styles.coverWrap, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.coverHead}>
          <Eyebrow tone="warmMuted">My Cellar</Eyebrow>
          <View style={styles.coverActions}>
            <Pressable onPress={() => setShowScan(true)} hitSlop={8}>
              <Ionicons name="scan-outline" size={22} color={colors.textWarm} />
            </Pressable>
            <Pressable onPress={() => router.push('/(tabs)/messages' as any)} hitSlop={8}>
              <Ionicons name="paper-plane-outline" size={20} color={colors.textWarm} />
              {hasUnread && <View style={styles.headerDot} />}
            </Pressable>
            <Pressable onPress={() => router.push('/settings' as any)} hitSlop={8}>
              <Ionicons name="settings-outline" size={20} color={colors.textWarm} />
              {unreadCount > 0 && <View style={styles.headerDot} />}
            </Pressable>
          </View>
        </View>
        <H1 tone="warm" style={styles.coverTitle}>{displayName}</H1>
        {profile?.username && profile?.display_name ? (
          <Caption tone="warmMuted">@{profile.username}</Caption>
        ) : null}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        <ProfileHeader
          profile={profile}
          fallbackChar={fallbackChar}
          gatherings={gatherings.length}
          purchases={purchaseCount}
        />
        <BioRow
          bio={profile?.bio}
          tasteParts={[taste?.topCategory, taste?.topCountry, taste?.topRegion, taste?.topWineType]}
        />

        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn} onPress={() => setShowEdit(true)}>
            <Body style={styles.actionBtnText}>프로필 편집</Body>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => Alert.alert('준비중', '셀러 공유 링크 곧 지원')}>
            <Body style={styles.actionBtnText}>셀러 공유</Body>
          </Pressable>
        </View>

        {/* 다음 모임 — 평면 카드 (CaveHero 제거됨, stats 는 ProfileHeader 흡수) */}
        <NextGatheringCard gatherings={gatherings} />

        <Tabs active={tab} onChange={setTab} />

        {tab === 'activity' && (
          <>
            <FriendsActivityRow />
            <RecentlyDrunkRow drinks={recentDrinks} />
            <RecommendedGatheringsRow recs={recommendedGatherings} />
            <FeaturedCavesRow caves={featuredCaves} loading={cavesLoading} />
            <MyPicksSection picks={picks} editable onAdd={addPick} onRemove={removePick} wines={collections} />
          </>
        )}

        {tab === 'cellar' && (
          <CellarGrid
            collections={collections}
            emptyText="아직 등록된 와인이 없어요. 우상단 스캔 버튼으로 시작해보세요."
          />
        )}

        {tab === 'gatherings' && <GatheringsList gatherings={gatherings} onTap={(id) => router.push(`/gathering/${id}`)} />}

        {tab === 'reviews' && <ReviewsList reviews={reviews} onTap={(id) => router.push(`/wine/${id}?from=profile` as any)} />}
      </ScrollView>

      <LabelScanSheet
        visible={showScan}
        onClose={() => setShowScan(false)}
        onAdded={() => {
          loadCollections(); loadTaste(); checkAndAwardBadges();
          // 새 와인 추가 시 activity 탭의 최근 마신/내 픽 재조회 필요.
          loadedTabsRef.current.delete('activity');
          loadedTabsRef.current.delete('reviews');
          if (tab === 'activity') loadActivityData();
        }}
      />
      <EditProfileModal
        visible={showEdit}
        profile={profile}
        onClose={() => setShowEdit(false)}
        onSave={save}
      />
    </View>
  );
}

// ─── Bio + taste — 같은 줄에 inline (bio 본문 / taste 작은 italic) ─
function BioRow({ bio, tasteParts }: { bio?: string | null; tasteParts: (string | null | undefined)[] }) {
  const taste = tasteParts.filter(Boolean).join(' · ');
  if (!bio && !taste) return null;
  return (
    <Body style={styles.bioRow} numberOfLines={2}>
      {bio ? <Body>{bio}</Body> : null}
      {bio && taste ? <Body style={styles.bioGap}>            </Body> : null}
      {taste ? <Caption tone="muted" style={styles.tasteInline}>{taste}</Caption> : null}
    </Body>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────
function Tabs({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const items: { key: Tab; label: string }[] = [
    { key: 'activity',   label: '활동' },
    { key: 'cellar',     label: '셀러' },
    { key: 'gatherings', label: '모임' },
    { key: 'reviews',    label: '후기' },
  ];
  return (
    <View style={styles.tabsRow}>
      {items.map(it => {
        const isActive = active === it.key;
        return (
          <Pressable
            key={it.key}
            style={[styles.tabBtn, isActive && styles.tabBtnActive]}
            onPress={() => onChange(it.key)}
          >
            <Label tone={isActive ? 'default' : 'muted'} style={isActive ? styles.tabTextActive : undefined}>
              {it.label}
            </Label>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── 친구의 셀러 가로 스크롤 ─────────────────────────────────────
function FeaturedCavesRow({ caves, loading }: { caves: any[]; loading: boolean }) {
  if (loading && caves.length === 0) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />;
  }
  if (caves.length === 0) return null;
  return (
    <View style={styles.featuredWrap}>
      <Eyebrow tone="muted" style={styles.featuredHeader}>친구의 셀러</Eyebrow>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>
        {caves.map(c => <FeaturedCaveCard key={c.user_id} cave={c} />)}
      </ScrollView>
    </View>
  );
}

// ─── Gatherings — D-day 카드 + 예정/지난 그룹핑 ─────────────────
function GatheringsList({ gatherings, onTap }: { gatherings: any[]; onTap: (id: number) => void }) {
  if (gatherings.length === 0) {
    return (
      <View style={styles.empty}>
        <Body style={styles.emptyEmoji}>🍷</Body>
        <BodyBold tone="warm">참여한 모임이 없어요</BodyBold>
        <Caption tone="muted">모임 탭에서 둘러보거나 직접 호스팅해보세요</Caption>
      </View>
    );
  }
  const now = Date.now();
  const upcoming = gatherings.filter(g => g.gathering_date && new Date(g.gathering_date).getTime() >= now)
    .sort((a, b) => new Date(a.gathering_date).getTime() - new Date(b.gathering_date).getTime());
  const past = gatherings.filter(g => !g.gathering_date || new Date(g.gathering_date).getTime() < now)
    .sort((a, b) => {
      const ta = a.gathering_date ? new Date(a.gathering_date).getTime() : 0;
      const tb = b.gathering_date ? new Date(b.gathering_date).getTime() : 0;
      return tb - ta;
    });

  return (
    <View style={styles.gatheringsWrap}>
      {upcoming.length > 0 && (
        <>
          <Eyebrow tone="muted" style={styles.gatheringGroupHeader}>예정 ({upcoming.length})</Eyebrow>
          {upcoming.map(g => <GatheringCard key={g.id} g={g} onTap={onTap} />)}
        </>
      )}
      {past.length > 0 && (
        <>
          <Eyebrow tone="muted" style={[styles.gatheringGroupHeader, { marginTop: spacing.lg }]}>지난 모임 ({past.length})</Eyebrow>
          {past.map(g => <GatheringCard key={g.id} g={g} onTap={onTap} past />)}
        </>
      )}
    </View>
  );
}

function GatheringCard({ g, onTap, past }: { g: any; onTap: (id: number) => void; past?: boolean }) {
  const dday = formatDday(g.gathering_date);
  const dateLabel = g.gathering_date ? formatGatheringDate(g.gathering_date) : '날짜 미정';
  const isHost = g.role === 'host';
  return (
    <Pressable
      style={[styles.gatheringCard, past && styles.gatheringCardPast]}
      onPress={() => onTap(g.id)}
    >
      <View style={[styles.dayBadge, past && styles.dayBadgePast]}>
        <BodyBold tone={past ? 'muted' : 'inverse'} style={past ? styles.dayMainPast : styles.dayMain}>
          {past ? '완료' : dday.label}
        </BodyBold>
        {!past && dday.sub && <Caption tone="inverse" style={styles.daySub}>{dday.sub}</Caption>}
      </View>
      <View style={styles.gatheringBody}>
        <BodyBold numberOfLines={1}>{g.title}</BodyBold>
        <Caption tone="muted" numberOfLines={1}>
          {dateLabel}
          {g.location ? `  ·  📍 ${g.location}` : ''}
        </Caption>
        <View style={styles.gatheringChips}>
          <View style={[styles.chip, isHost ? styles.chipHost : styles.chipMember]}>
            <Caption style={isHost ? styles.chipTextHost : styles.chipTextMember}>
              {isHost ? '호스트' : '참여'}
            </Caption>
          </View>
          {g.status === 'closed' && (
            <View style={[styles.chip, styles.chipClosed]}>
              <Caption tone="muted">마감</Caption>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function formatDday(iso: string | null): { label: string; sub?: string } {
  if (!iso) return { label: '미정' };
  const target = new Date(iso);
  const now = new Date();
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return { label: 'D-Day', sub: '오늘' };
  if (diffDays > 0) return { label: `D-${diffDays}` };
  return { label: `+${Math.abs(diffDays)}` };
}

function formatGatheringDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${'일월화수목금토'[d.getDay()]})`;
}

// ─── Reviews list ───────────────────────────────────────────────
function ReviewsList({ reviews, onTap }: { reviews: any[]; onTap: (id: number) => void }) {
  if (reviews.length === 0) {
    return <View style={styles.empty}><BodyBold tone="warm">아직 작성한 시음 후기가 없어요</BodyBold></View>;
  }
  return (
    <View style={styles.listWrap}>
      {reviews.map((r: any) => (
        <Pressable key={r.id} style={styles.listRow} onPress={() => onTap(r.id)}>
          <BodyBold numberOfLines={1}>
            {r.wine?.name ?? '와인'}
            {r.rating ? `  ·  ★ ${r.rating}` : ''}
          </BodyBold>
          {r.tasting_note && <Caption tone="muted" style={styles.listSub} numberOfLines={2}>{r.tasting_note}</Caption>}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerDot: {
    position: 'absolute', top: -2, right: -4,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.error,
  },

  // ─── 매거진 표지 영역 ───
  coverWrap: {
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  coverHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  coverActions: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  coverTitle: {
    fontSize: 28, lineHeight: 34, letterSpacing: -0.6,
    marginBottom: 2,
  },

  // bio 행 — 한 줄에 bio + (큰 공백) + taste italic
  bioRow: { paddingHorizontal: spacing.md, marginTop: spacing.sm, lineHeight: fontSize.body * 1.4 },
  bioGap: { color: 'transparent' }, // 공백 시각화 안 됨 (gap 역할)
  tasteInline: { fontStyle: 'italic' },

  actionRow: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingTop: spacing.base, paddingBottom: spacing.base,
  },
  actionBtn: {
    flex: 1, paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
  },
  actionBtnText: { fontWeight: fontWeight.semibold as any },

  tabsRow: {
    flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  tabBtn: {
    flex: 1, paddingVertical: spacing.base, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: colors.text },
  tabTextActive: { fontWeight: fontWeight.bold as any },

  empty: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  emptyEmoji: { fontSize: 36, marginBottom: spacing.base, opacity: 0.5 },

  listWrap: { paddingVertical: spacing.sm },
  listRow: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.surfaceLight,
  },
  listSub: { marginTop: spacing.xs, lineHeight: 17 },

  featuredWrap: { marginTop: spacing.lg },
  featuredHeader: { paddingHorizontal: spacing.md, marginBottom: spacing.base },
  featuredScroll: { paddingHorizontal: spacing.md, paddingRight: spacing.sm, gap: spacing.base },

  // ─── 모임 D-day 카드 ───
  gatheringsWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  gatheringGroupHeader: { marginBottom: spacing.sm },
  gatheringCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.base,
    overflow: 'hidden',
  },
  gatheringCardPast: { opacity: 0.7 },
  dayBadge: {
    width: 64,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  dayBadgePast: { backgroundColor: colors.surfaceLight },
  dayMain: { fontSize: 16, letterSpacing: -0.4 },
  dayMainPast: { fontSize: 12 },
  daySub: { color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  gatheringBody: { flex: 1, padding: spacing.base, gap: spacing.xs },
  gatheringChips: { flexDirection: 'row', gap: 6, marginTop: spacing.xs },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.xs },
  chipHost: { backgroundColor: colors.primaryLight },
  chipMember: { backgroundColor: colors.surfaceLight },
  chipClosed: { backgroundColor: colors.surfaceLight },
  chipTextHost: { color: colors.primary, fontWeight: fontWeight.bold as any },
  chipTextMember: { color: colors.textSecondary, fontWeight: fontWeight.bold as any },
});
