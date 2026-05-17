import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { FollowButton } from '@/components/FollowButton';
import { getTopBadge } from '@/lib/tierUtils';
import { UserAvatar } from '@/components/UserAvatar';
import { PartnerBadge } from '@/components/PartnerBadge';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { BodyBold, Body, Caption, Eyebrow, Label } from '@/components/Typography';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { useUserGatherings } from '@/lib/hooks/useUserGatherings';
import { useUserPicks } from '@/lib/hooks/useUserPicks';
import { useUserBadges } from '@/lib/hooks/useUserBadges';
import { MyPicksSection } from '@/components/MyPicksSection';
import { BadgeList } from '@/components/BadgeList';
import { UserCellarSection } from '@/components/UserCellarSection';
import { getDMRoom } from '@/lib/hooks/useChat';
import { formatMonthDay } from '@/lib/utils/dateUtils';

/**
 * 다른 사람 셀러 페이지 — Profile 탭과 동일 톤 (2026-05-14 redesign A).
 *
 * 구조:
 *   ScreenHeader (back + 메시지)
 *   ProfileBlock — 아바타 + stats(병/모임/팔로워/팔로잉) 한 줄
 *   IdentityBlock — display_name + handle + 배지 + bio
 *   Actions — 팔로우 + 메시지
 *   Section — 배지 / 모임 / 픽 / 셀러
 */
export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const { gatherings: userGatherings, loadGatherings: loadUserGatherings } = useUserGatherings(id);
  const { picks: userPicks, loadPicks: loadUserPicks } = useUserPicks(id);
  const { badges: userBadges, allBadges, loadBadges } = useUserBadges(id);

  useEffect(() => {
    if (id) {
      loadProfile();
      loadCollections();
      loadUserGatherings();
      loadUserPicks();
      loadBadges();
    }
  }, [id]);

  async function loadProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (data) setProfile(data);
  }

  async function loadCollections() {
    const { data } = await supabase
      .from('collections')
      .select(`
        id, photo_url, created_at, user_id,
        wine:wines(id, name, producer, category, region, country, vintage_year, image_url)
      `)
      .eq('user_id', id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setCollections(data);
  }

  if (!profile) return <View style={styles.container} />;

  const fallbackChar = profile.display_name?.[0] || profile.username?.[0] || '?';
  const topBadge = getTopBadge(profile.collection_count || 0);
  const displayName = profile.display_name || profile.username;
  const isMe = user?.id === id;

  async function openDM() {
    if (!user) return;
    const res = await getDMRoom(user.id, id!);
    if ('error' in res) {
      Alert.alert('DM 열기 실패', res.error);
      return;
    }
    router.push(`/chat/${res.roomId}?title=${encodeURIComponent(profile.username)}`);
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title=""
        left={<BackButton fallbackPath="/(tabs)/explore" />}
        right={!isMe ? (
          <Pressable onPress={openDM} hitSlop={8}>
            <Ionicons name="paper-plane-outline" size={20} color={colors.textWarm} />
          </Pressable>
        ) : undefined}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {/* ─── 아바타 + stats (Profile 탭과 동일 패턴) ─── */}
        <View style={styles.headerRow}>
          <UserAvatar
            uri={profile.avatar_url}
            fallbackChar={fallbackChar}
            collectionCount={profile.collection_count || 0}
            size="xl"
          />
          <View style={styles.statsCol}>
            <View style={styles.statsRow}>
              <Stat num={profile.collection_count || 0} label="병" />
              <Stat num={userGatherings.length} label="모임" />
              <Stat num={userPicks.length} label="픽" />
            </View>
            <Caption tone="warmMuted" style={styles.socialLine}>
              팔로워 <Caption tone="warm" style={styles.socialNum}>{profile.follower_count || 0}</Caption>
              {'  ·  '}
              팔로잉 <Caption tone="warm" style={styles.socialNum}>{profile.following_count || 0}</Caption>
            </Caption>
          </View>
        </View>

        {/* ─── 이름 / handle / 배지 / bio ─── */}
        <View style={styles.identityBlock}>
          <View style={styles.nameRow}>
            <BodyBold tone="warm" style={styles.displayName}>{displayName}</BodyBold>
            {topBadge && (
              <View style={[styles.topBadge, { backgroundColor: topBadge.bg }]}>
                <Label style={{ color: topBadge.color }}>{topBadge.name}</Label>
              </View>
            )}
            {profile.is_partner ? <PartnerBadge label={profile.partner_label} size="sm" /> : null}
          </View>
          <Caption tone="warmMuted">@{profile.username}</Caption>
          {profile.bio ? (
            <Body tone="warm" style={styles.bio}>{profile.bio}</Body>
          ) : null}
        </View>

        {/* ─── Actions ─── */}
        {!isMe && (
          <View style={styles.actions}>
            <FollowButton targetUserId={id!} />
            <Pressable style={styles.dmBtn} onPress={openDM}>
              <Body tone="warm" style={styles.dmBtnText}>메시지</Body>
            </Pressable>
          </View>
        )}

        {/* ─── 섹션들 — hairline divider 로 분리 ─── */}
        {userBadges.length > 0 && (
          <Section eyebrow={`BADGES · ${userBadges.length}`}>
            <BadgeList allBadges={allBadges} earnedIds={new Set(userBadges.map(b => b.badge_id))} />
          </Section>
        )}

        {userPicks.length > 0 && (
          <Section eyebrow={`PICKS · ${userPicks.length}`}>
            <MyPicksSection picks={userPicks} />
          </Section>
        )}

        {userGatherings.length > 0 && (
          <Section eyebrow={`GATHERINGS · ${userGatherings.length}`}>
            <View style={styles.gatheringsList}>
              {userGatherings.map(g => {
                const dateStr = formatMonthDay(g.gathering_date);
                return (
                  <Pressable key={g.id} style={styles.gatheringItem} onPress={() => router.push(`/gathering/${g.id}`)}>
                    <View style={styles.gatheringInfo}>
                      <BodyBold tone="warm">{g.title}</BodyBold>
                      <Caption tone="muted">{dateStr}{g.location ? ` · ${g.location}` : ''}</Caption>
                    </View>
                    <View style={[styles.gatheringRole, g.role === 'host' && styles.gatheringRoleHost]}>
                      <Caption style={g.role === 'host' ? styles.gatheringRoleTextHost : styles.gatheringRoleText}>
                        {g.role === 'host' ? '호스트' : '참여'}
                      </Caption>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Section>
        )}

        <Section eyebrow={`CELLAR · ${profile.collection_count || 0}`}>
          <UserCellarSection ownerId={id!} wines={collections} />
        </Section>
      </ScrollView>
    </View>
  );
}

function Stat({ num, label }: { num: number; label: string }) {
  return (
    <View style={styles.stat}>
      <BodyBold tone="warm" style={styles.statNum}>{num}</BodyBold>
      <Label tone="muted">{label}</Label>
    </View>
  );
}

function Section({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Eyebrow tone="warmMuted" style={styles.sectionEyebrow}>{eyebrow}</Eyebrow>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  // ─── 아바타 + stats 한 줄 ───
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.base,
    gap: spacing.base,
  },
  statsCol: { flex: 1, justifyContent: 'center', gap: spacing.base },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 18, letterSpacing: -0.3 },
  socialLine: { textAlign: 'center' },
  socialNum: { fontWeight: '600' },

  // ─── 이름/배지/bio ───
  identityBlock: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  displayName: { fontSize: 16 },
  topBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  bio: { marginTop: spacing.sm, lineHeight: 20 },

  // ─── Actions ───
  actions: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingBottom: spacing.lg,
  },
  dmBtn: {
    flex: 1,
    borderWidth: 1, borderColor: colors.borderStrong,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  dmBtnText: { fontWeight: '600' },

  // ─── 섹션 (eyebrow + 콘텐츠, 사이 hairline) ───
  section: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1, borderTopColor: colors.borderStrong,
  },
  sectionEyebrow: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.base,
    letterSpacing: 1.5,
  },

  // ─── 모임 목록 ───
  gatheringsList: { paddingHorizontal: spacing.md },
  gatheringItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  gatheringInfo: { flex: 1, gap: spacing.xs },
  gatheringRole: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  gatheringRoleHost: { backgroundColor: colors.primaryLight },
  gatheringRoleText: { color: colors.textWarmMuted, fontWeight: '600' },
  gatheringRoleTextHost: { color: colors.primary, fontWeight: '600' },
});
