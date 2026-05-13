import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/hooks/useProfile';
import { useUserBadges } from '@/lib/hooks/useUserBadges';
import { useUserPicks } from '@/lib/hooks/useUserPicks';
import { useUserGatherings } from '@/lib/hooks/useUserGatherings';
import { useUnreadDM } from '@/lib/hooks/useUnreadDM';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProfileHeader } from '@/components/ProfileHeader';
import { CellarGrid, type CellarGridItem } from '@/components/CellarGrid';
import { BadgeList } from '@/components/BadgeList';
import { EditProfileModal } from '@/components/EditProfileModal';
import { EditPartnerProfileSheet } from '@/components/EditPartnerProfileSheet';
import { CardTemplateDefaultSheet } from '@/components/CardTemplateDefaultSheet';

type Tab = 'cellar' | 'picks' | 'gatherings' | 'reviews' | 'settings';

/**
 * 인스타식 본인 프로필. /user/[id] 와 동일 멘탈 모델:
 *  - 헤더(아바타 + stats + bio)
 *  - segmented tabs (셀러 그리드 / 픽 / 모임 / 후기 / 설정)
 *  - 셀러 = 3-column 그리드 (인스타 패턴)
 *
 * 기존 setting 류 (메시지·카드 디자인·파트너 편집·배지·로그아웃) 는 마지막
 * "설정" 탭으로 묶음.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('cellar');
  const [showEdit, setShowEdit] = useState(false);
  const [showPartnerEdit, setShowPartnerEdit] = useState(false);
  const [showCardTemplate, setShowCardTemplate] = useState(false);

  const { badges: userBadges, allBadges, loadBadges } = useUserBadges(user?.id);
  const { profile, save } = useProfile(user?.id, user?.email, [loadBadges]);
  const { picks, loadPicks } = useUserPicks(user?.id);
  const { gatherings, loadGatherings } = useUserGatherings(user?.id);
  const { hasUnread } = useUnreadDM();

  const [collections, setCollections] = useState<CellarGridItem[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  const loadCollections = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('collections')
      .select('id, photo_url, wine:wines(name, image_url, category)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setCollections((data ?? []) as unknown as CellarGridItem[]);
  }, [user?.id]);

  const loadReviews = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('collections')
      .select('id, tasting_note, rating, tasting_note_updated_at, photo_url, wine:wines(id, name, producer, vintage_year, image_url)')
      .eq('user_id', user.id)
      .not('tasting_note', 'is', null)
      .order('tasting_note_updated_at', { ascending: false, nullsFirst: false })
      .limit(30);
    setReviews((data ?? []).filter((r: any) => r.tasting_note?.trim().length > 0));
  }, [user?.id]);

  useFocusEffect(useCallback(() => { loadCollections(); loadReviews(); loadPicks(); loadGatherings(); }, [loadCollections, loadReviews, loadPicks, loadGatherings]));

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
          <Pressable onPress={() => setTab('settings')} hitSlop={8}>
            <Ionicons name="settings-outline" size={20} color="#222" />
          </Pressable>
        }
      />

      <ScrollView>
        <ProfileHeader profile={profile} fallbackChar={fallbackChar} />

        {profile?.bio ? (
          <Text style={styles.bio}>{profile.bio}</Text>
        ) : null}

        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn} onPress={() => setShowEdit(true)}>
            <Text style={styles.actionBtnText}>프로필 편집</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => Alert.alert('준비중', '셀러 공유 링크 곧 지원')}>
            <Text style={styles.actionBtnText}>셀러 공유</Text>
          </Pressable>
        </View>

        <Tabs active={tab} onChange={setTab} unread={hasUnread} />

        {tab === 'cellar' && (
          <CellarGrid
            collections={collections}
            emptyText="아직 등록된 와인이 없어요. 라벨 스캔으로 시작해보세요."
          />
        )}

        {tab === 'picks' && <PicksList picks={picks} />}

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

        <View style={{ height: 40 }} />
      </ScrollView>

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
    { key: 'cellar',     label: '셀러' },
    { key: 'picks',      label: '픽' },
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

// ─── Picks list ────────────────────────────────────────────────────
function PicksList({ picks }: { picks: any[] }) {
  if (picks.length === 0) {
    return <View style={styles.empty}><Text style={styles.emptyText}>아직 픽한 와인이 없어요</Text></View>;
  }
  return (
    <View style={styles.listWrap}>
      {picks.map((p: any) => (
        <View key={p.id} style={styles.listRow}>
          <Text style={styles.listMain} numberOfLines={1}>{p.wine?.name ?? '와인'}</Text>
          {p.note && <Text style={styles.listSub} numberOfLines={2}>{p.note}</Text>}
        </View>
      ))}
    </View>
  );
}

// ─── Gatherings list ───────────────────────────────────────────────
function GatheringsList({ gatherings, onTap }: { gatherings: any[]; onTap: (id: number) => void }) {
  if (gatherings.length === 0) {
    return <View style={styles.empty}><Text style={styles.emptyText}>참여한 모임이 없어요</Text></View>;
  }
  return (
    <View style={styles.listWrap}>
      {gatherings.map((g: any) => (
        <Pressable key={g.id} style={styles.listRow} onPress={() => onTap(g.id)}>
          <Text style={styles.listMain} numberOfLines={1}>{g.title}</Text>
          {g.location && <Text style={styles.listSub}>{g.location}</Text>}
        </Pressable>
      ))}
    </View>
  );
}

// ─── Reviews list ──────────────────────────────────────────────────
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

// ─── Settings ──────────────────────────────────────────────────────
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

  bio: { fontSize: 13, color: '#444', paddingHorizontal: 20, marginTop: 4, lineHeight: 19 },
  actionRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  actionBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#f5f5f5', alignItems: 'center',
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#222' },

  tabsRow: {
    flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: '#efefef',
  },
  tabBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: '#222' },
  tabText: { fontSize: 12, color: '#999', fontWeight: '500' },
  tabTextActive: { color: '#222', fontWeight: '700' },
  tabDot: { position: 'absolute', top: 8, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ed4956' },

  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#999' },

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
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#222', marginBottom: 10 },

  signOutBtn: {
    marginHorizontal: 20, marginTop: 24, marginBottom: 12,
    paddingVertical: 12, borderRadius: 8,
    alignItems: 'center', borderWidth: 1, borderColor: '#eee',
  },
  signOutText: { fontSize: 13, color: '#999' },
});
