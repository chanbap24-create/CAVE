import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProfileHeader } from '@/components/ProfileHeader';
import { CaveHero } from '@/components/CaveHero';
import { NextGatheringCard } from '@/components/NextGatheringCard';
import { FriendsActivityRow } from '@/components/FriendsActivityRow';
import { RecommendedGatheringsRow } from '@/components/RecommendedGatheringsRow';
import { RecentlyDrunkRow } from '@/components/RecentlyDrunkRow';
import { FeaturedCaveCard } from '@/components/FeaturedCaveCard';
import { MyPicksSection } from '@/components/MyPicksSection';
import { CellarGrid, type CellarGridItem } from '@/components/CellarGrid';
import { BadgeList } from '@/components/BadgeList';
import { LabelScanSheet } from '@/components/LabelScanSheet';
import { EditProfileModal } from '@/components/EditProfileModal';
import { EditPartnerProfileSheet } from '@/components/EditPartnerProfileSheet';
import { CardTemplateDefaultSheet } from '@/components/CardTemplateDefaultSheet';

type Tab = 'activity' | 'cellar' | 'gatherings' | 'reviews' | 'settings';

/**
 * 프로필 = 통합 홈. 셀러 탭이 폐기되고 그 활동 컨텐츠가 여기로 흡수됨.
 *
 * persistent 위 (모든 탭 공통):
 *   - ProfileHeader (아바타 / 이름 / stats)
 *   - bio + 편집/공유
 *   - CaveHero (병/모임/구매)
 *   - NextGatheringCard (다음 모임)
 *
 * Segmented tabs (5):
 *   활동 (default) — 친구 활동 + 최근 마신 + 추천 모임 + 친구 셀러 + 내 픽
 *   셀러 — 그리드
 *   모임 — 본인 참여 모임 list
 *   후기 — 본인 노트 작성한 와인 list
 *   설정 — 메시지/카드 디자인/파트너/배지/로그아웃
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('activity');
  const [refreshing, setRefreshing] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showPartnerEdit, setShowPartnerEdit] = useState(false);
  const [showCardTemplate, setShowCardTemplate] = useState(false);
  const [showScan, setShowScan] = useState(false);

  const { taste, loadTaste } = useTasteProfile(user?.id);
  const { badges: userBadges, allBadges, loadBadges } = useUserBadges(user?.id);
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

  const loadAll = useCallback(() => {
    loadCollections(); loadReviews(); loadPicks(); loadGatherings(); loadRecs();
    refreshDrinks(); refreshCaves(); loadUnreadCount(); checkAndAwardBadges();
  }, [loadCollections, loadReviews, loadPicks, loadGatherings, loadRecs, refreshDrinks, refreshCaves, loadUnreadCount, checkAndAwardBadges]);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  async function onRefresh() {
    setRefreshing(true);
    loadAll();
    setTimeout(() => setRefreshing(false), 600);
  }

  const fallbackChar = profile?.display_name?.[0] || user?.email?.[0] || '?';

  function confirmSignOut() {
    Alert.alert('로그아웃', '정말 로그아웃하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        variant="centered"
        title={profile?.username ? `@${profile.username}` : (profile?.display_name || 'Profile')}
        right={
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Pressable onPress={() => setShowScan(true)} hitSlop={8}>
              <Ionicons name="scan-outline" size={22} color="#222" />
            </Pressable>
            <Pressable onPress={() => setTab('settings')} hitSlop={8}>
              <Ionicons name="settings-outline" size={20} color="#222" />
              {(hasUnread || unreadCount > 0) && <View style={styles.headerDot} />}
            </Pressable>
          </View>
        }
      />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <ProfileHeader profile={profile} fallbackChar={fallbackChar} />
        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn} onPress={() => setShowEdit(true)}>
            <Text style={styles.actionBtnText}>프로필 편집</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => Alert.alert('준비중', '셀러 공유 링크 곧 지원')}>
            <Text style={styles.actionBtnText}>셀러 공유</Text>
          </Pressable>
        </View>

        {/* persistent home blocks — 활동 탭 외에서도 늘 보임 */}
        <CaveHero
          bottles={collectionCount}
          gatherings={gatherings.length}
          purchases={purchaseCount}
          summary={[taste?.topCategory, taste?.topCountry, taste?.topRegion, taste?.topWineType]}
        />
        <NextGatheringCard gatherings={gatherings} />

        <Tabs active={tab} onChange={setTab} unread={hasUnread || unreadCount > 0} />

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

        {tab === 'reviews' && <ReviewsList reviews={reviews} onTap={(id) => router.push(`/wine/${id}` as any)} />}

        {tab === 'settings' && (
          <SettingsList
            isPartner={!!profile?.is_partner}
            badges={{ earned: userBadges.length, total: allBadges.length, allBadges, userBadges }}
            unreadDM={hasUnread}
            onMessages={() => router.push('/(tabs)/messages' as any)}
            onCardTemplate={() => setShowCardTemplate(true)}
            onPartnerEdit={() => setShowPartnerEdit(true)}
            onSignOut={confirmSignOut}
          />
        )}
      </ScrollView>

      <LabelScanSheet
        visible={showScan}
        onClose={() => setShowScan(false)}
        onAdded={() => { loadCollections(); loadTaste(); checkAndAwardBadges(); }}
      />
      <EditProfileModal
        visible={showEdit}
        profile={profile}
        onClose={() => setShowEdit(false)}
        onSave={save}
      />
      <EditPartnerProfileSheet
        visible={showPartnerEdit}
        profile={profile}
        onClose={() => setShowPartnerEdit(false)}
        onSaved={() => setShowPartnerEdit(false)}
      />
      <CardTemplateDefaultSheet
        visible={showCardTemplate}
        onClose={() => setShowCardTemplate(false)}
      />
    </View>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────
function Tabs({ active, onChange, unread }: { active: Tab; onChange: (t: Tab) => void; unread: boolean }) {
  const items: { key: Tab; label: string }[] = [
    { key: 'activity',   label: '활동' },
    { key: 'cellar',     label: '셀러' },
    { key: 'gatherings', label: '모임' },
    { key: 'reviews',    label: '후기' },
    { key: 'settings',   label: '설정' },
  ];
  return (
    <View style={styles.tabsRow}>
      {items.map(it => (
        <Pressable
          key={it.key}
          style={[styles.tabBtn, active === it.key && styles.tabBtnActive]}
          onPress={() => onChange(it.key)}
        >
          <Text style={[styles.tabText, active === it.key && styles.tabTextActive]}>{it.label}</Text>
          {it.key === 'settings' && unread && <View style={styles.tabDot} />}
        </Pressable>
      ))}
    </View>
  );
}

// ─── 친구의 셀러 가로 스크롤 ─────────────────────────────────────
function FeaturedCavesRow({ caves, loading }: { caves: any[]; loading: boolean }) {
  if (loading && caves.length === 0) {
    return <ActivityIndicator color="#7b2d4e" style={{ marginTop: 24 }} />;
  }
  if (caves.length === 0) return null;
  return (
    <View style={styles.featuredWrap}>
      <Text style={styles.sectionTitle}>친구의 셀러</Text>
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
        <Text style={styles.emptyEmoji}>🍷</Text>
        <Text style={styles.emptyText}>참여한 모임이 없어요</Text>
        <Text style={styles.emptySub}>모임 탭에서 둘러보거나 직접 호스팅해보세요</Text>
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
          <Text style={styles.gatheringGroupHeader}>예정 ({upcoming.length})</Text>
          {upcoming.map(g => <GatheringCard key={g.id} g={g} onTap={onTap} />)}
        </>
      )}
      {past.length > 0 && (
        <>
          <Text style={[styles.gatheringGroupHeader, { marginTop: 24 }]}>지난 모임 ({past.length})</Text>
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
        <Text style={[styles.dayMain, past && styles.dayMainPast]}>{past ? '완료' : dday.label}</Text>
        {!past && dday.sub && <Text style={styles.daySub}>{dday.sub}</Text>}
      </View>
      <View style={styles.gatheringBody}>
        <Text style={styles.gatheringTitle} numberOfLines={1}>{g.title}</Text>
        <Text style={styles.gatheringMeta} numberOfLines={1}>
          {dateLabel}
          {g.location ? `  ·  📍 ${g.location}` : ''}
        </Text>
        <View style={styles.gatheringChips}>
          <View style={[styles.chip, isHost ? styles.chipHost : styles.chipMember]}>
            <Text style={[styles.chipText, isHost ? styles.chipTextHost : styles.chipTextMember]}>
              {isHost ? '호스트' : '참여'}
            </Text>
          </View>
          {g.status === 'closed' && (
            <View style={[styles.chip, styles.chipClosed]}>
              <Text style={[styles.chipText, styles.chipTextClosed]}>마감</Text>
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
    return <View style={styles.empty}><Text style={styles.emptyText}>아직 작성한 시음 후기가 없어요</Text></View>;
  }
  return (
    <View style={styles.listWrap}>
      {reviews.map((r: any) => (
        <Pressable key={r.id} style={styles.listRow} onPress={() => onTap(r.id)}>
          <Text style={styles.listMain} numberOfLines={1}>
            {r.wine?.name ?? '와인'}
            {r.rating ? `  · ★ ${r.rating}` : ''}
          </Text>
          {r.tasting_note && <Text style={styles.listSub} numberOfLines={2}>{r.tasting_note}</Text>}
        </Pressable>
      ))}
    </View>
  );
}

// ─── Settings ──────────────────────────────────────────────────
function SettingsList({
  isPartner, badges, unreadDM, onMessages, onCardTemplate, onPartnerEdit, onSignOut,
}: {
  isPartner: boolean;
  badges: { earned: number; total: number; allBadges: any[]; userBadges: any[] };
  unreadDM: boolean;
  onMessages: () => void;
  onCardTemplate: () => void;
  onPartnerEdit: () => void;
  onSignOut: () => void;
}) {
  return (
    <View>
      <Pressable style={styles.menuRow} onPress={onMessages}>
        <View style={styles.menuLeft}>
          <Ionicons name="chatbubble-outline" size={20} color="#222" />
          <Text style={styles.menuLabel}>메시지</Text>
          {unreadDM && <View style={styles.menuDot} />}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#bbb" />
      </Pressable>

      <Pressable style={styles.menuRow} onPress={onCardTemplate}>
        <View style={styles.menuLeft}>
          <Ionicons name="color-palette-outline" size={20} color="#222" />
          <Text style={styles.menuLabel}>내 카드 디자인</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#bbb" />
      </Pressable>

      {isPartner ? (
        <Pressable style={styles.menuRow} onPress={onPartnerEdit}>
          <View style={styles.menuLeft}>
            <Ionicons name="ribbon-outline" size={20} color="#7b2d4e" />
            <Text style={[styles.menuLabel, { color: '#7b2d4e' }]}>파트너 소개 편집</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#bbb" />
        </Pressable>
      ) : null}

      <View style={styles.badgeSection}>
        <Text style={styles.sectionTitle}>배지 ({badges.earned}/{badges.total})</Text>
        <BadgeList
          allBadges={badges.allBadges}
          earnedIds={new Set(badges.userBadges.map((b: any) => b.badge_id))}
        />
      </View>

      <Pressable style={styles.signOutBtn} onPress={onSignOut}>
        <Text style={styles.signOutText}>로그아웃</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerDot: { position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ed4956' },

  bio: { fontSize: 13, color: '#444', paddingHorizontal: 20, marginTop: 4, lineHeight: 19 },
  actionRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f5f5f5', alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#222' },

  tabsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#efefef', marginTop: 8 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#222' },
  tabText: { fontSize: 12, color: '#999', fontWeight: '500' },
  tabTextActive: { color: '#222', fontWeight: '700' },
  tabDot: { position: 'absolute', top: 8, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ed4956' },

  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyEmoji: { fontSize: 36, marginBottom: 12, opacity: 0.5 },
  emptyText: { fontSize: 14, color: '#666', fontWeight: '600' },
  emptySub: { fontSize: 12, color: '#999', marginTop: 4 },

  listWrap: { paddingVertical: 8 },
  listRow: { paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  listMain: { fontSize: 14, fontWeight: '600', color: '#222' },
  listSub: { fontSize: 12, color: '#666', marginTop: 4, lineHeight: 17 },

  menuRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 14, color: '#222' },
  menuDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ed4956', marginLeft: 4 },

  badgeSection: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#222', marginBottom: 10, paddingHorizontal: 0 },

  signOutBtn: {
    marginHorizontal: 20, marginTop: 24, marginBottom: 12,
    paddingVertical: 12, borderRadius: 8,
    alignItems: 'center', borderWidth: 1, borderColor: '#eee',
  },
  signOutText: { fontSize: 13, color: '#999' },

  featuredWrap: { marginTop: 24 },
  featuredScroll: { paddingHorizontal: 16, paddingRight: 8, gap: 12 },

  // 모임 — D-day 카드
  gatheringsWrap: { paddingHorizontal: 16, paddingTop: 16 },
  gatheringGroupHeader: {
    fontSize: 12, fontWeight: '700', color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 8,
  },
  gatheringCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1, borderColor: '#eee',
    marginBottom: 10,
    overflow: 'hidden',
  },
  gatheringCardPast: { opacity: 0.7 },
  dayBadge: {
    width: 64,
    backgroundColor: '#7b2d4e',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14,
  },
  dayBadgePast: { backgroundColor: '#e0e0e0' },
  dayMain: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  dayMainPast: { color: '#999', fontSize: 12 },
  daySub: { fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  gatheringBody: { flex: 1, padding: 12, gap: 4 },
  gatheringTitle: { fontSize: 15, fontWeight: '700', color: '#222' },
  gatheringMeta: { fontSize: 11, color: '#666' },
  gatheringChips: { flexDirection: 'row', gap: 6, marginTop: 4 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  chipHost: { backgroundColor: '#fef0f3' },
  chipMember: { backgroundColor: '#f0f0f0' },
  chipClosed: { backgroundColor: '#f5f5f5' },
  chipText: { fontSize: 10, fontWeight: '700' },
  chipTextHost: { color: '#7b2d4e' },
  chipTextMember: { color: '#666' },
  chipTextClosed: { color: '#999' },
});
