import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { FollowButton } from '@/components/FollowButton';
import { getTopBadge } from '@/lib/tierUtils';
import { UserAvatar } from '@/components/UserAvatar';
import { PartnerBadge } from '@/components/PartnerBadge';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { H1, BodyBold, Body, Caption, Eyebrow, Label } from '@/components/Typography';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { useUserGatherings } from '@/lib/hooks/useUserGatherings';
import { useUserPicks } from '@/lib/hooks/useUserPicks';
import { useUserBadges } from '@/lib/hooks/useUserBadges';
import { MyPicksSection } from '@/components/MyPicksSection';
import { BadgeList } from '@/components/BadgeList';
import { UserCellarSection } from '@/components/UserCellarSection';
import { RecentlyAddedRow } from '@/components/RecentlyAddedRow';
import { getDMRoom } from '@/lib/hooks/useChat';
import { formatMonthDay } from '@/lib/utils/dateUtils';

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

  return (
    <View style={styles.container}>
      <ScreenHeader title="" left={<BackButton fallbackPath="/(tabs)/explore" />} />

      <ScrollView>
        {/* 매거진 표지 */}
        <View style={styles.cover}>
          <Caption tone="warmMuted" style={styles.eyebrow}>@{profile.username}</Caption>
          <H1 tone="warm" style={styles.coverTitle}>{displayName}</H1>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs }}>
            {topBadge && (
              <View style={[styles.topBadge, { backgroundColor: topBadge.bg }]}>
                <Label style={{ color: topBadge.color }}>{topBadge.name}</Label>
              </View>
            )}
            {profile.is_partner ? <PartnerBadge label={profile.partner_label} size="sm" /> : null}
          </View>
        </View>

        <View style={styles.profileTop}>
          <UserAvatar
            uri={profile.avatar_url}
            fallbackChar={fallbackChar}
            collectionCount={profile.collection_count || 0}
            size="xl"
          />
          <View style={styles.profileStats}>
            <View style={styles.stat}>
              <BodyBold style={styles.statNum}>{profile.post_count || 0}</BodyBold>
              <Label tone="muted">게시물</Label>
            </View>
            <View style={styles.stat}>
              <BodyBold style={styles.statNum}>{profile.follower_count || 0}</BodyBold>
              <Label tone="muted">팔로워</Label>
            </View>
            <View style={styles.stat}>
              <BodyBold style={styles.statNum}>{profile.following_count || 0}</BodyBold>
              <Label tone="muted">팔로잉</Label>
            </View>
          </View>
        </View>

        {profile.bio ? (
          <Body tone="warm" style={styles.profileBio}>{profile.bio}</Body>
        ) : null}

        <View style={styles.actions}>
          <FollowButton targetUserId={id!} />
          {user?.id !== id && (
            <Pressable style={styles.dmBtn} onPress={async () => {
              if (!user) return;
              const res = await getDMRoom(user.id, id!);
              if ('error' in res) {
                Alert.alert('DM 열기 실패', res.error);
                return;
              }
              router.push(`/chat/${res.roomId}?title=${encodeURIComponent(profile.username)}`);
            }}>
              <Body tone="warm" style={styles.dmBtnText}>메시지</Body>
            </Pressable>
          )}
        </View>

        {userBadges.length > 0 && (
          <View style={{ marginBottom: spacing.base }}>
            <Eyebrow tone="warmMuted" style={styles.sectionTitleEyebrow}>BADGES · {userBadges.length}</Eyebrow>
            <BadgeList allBadges={allBadges} earnedIds={new Set(userBadges.map(b => b.badge_id))} />
          </View>
        )}

        {userPicks.length > 0 && <MyPicksSection picks={userPicks} />}

        {userGatherings.length > 0 && (
          <View style={styles.gatheringSection}>
            <Eyebrow tone="warmMuted" style={styles.sectionTitleEyebrow}>GATHERINGS · {userGatherings.length}</Eyebrow>
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
                      {g.role === 'host' ? 'Host' : 'Joined'}
                    </Caption>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Recently Added hero strip — same album-art cards we show on
            My Cave, so visitors see the owner's latest bottles at a glance
            before scrolling into the full cellar list. */}
        <RecentlyAddedRow wines={collections} />

        <UserCellarSection ownerId={id!} wines={collections} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  cover: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  eyebrow: { letterSpacing: 1, marginBottom: spacing.sm },
  coverTitle: { fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  topBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },

  profileTop: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.borderStrong,
  },
  profileStats: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 18, letterSpacing: -0.3 },

  profileBio: {
    paddingHorizontal: spacing.md, paddingBottom: spacing.md,
    backgroundColor: colors.background,
    lineHeight: 19,
  },

  actions: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  dmBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm, alignItems: 'center',
  },
  dmBtnText: { fontWeight: '600' },

  gatheringSection: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  gatheringItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.borderStrong,
  },
  gatheringInfo: { flex: 1 },
  gatheringRole: { backgroundColor: '#e8f5e9', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  gatheringRoleHost: { backgroundColor: colors.primaryLight },
  gatheringRoleText: { color: '#2e7d32', fontWeight: '600' },
  gatheringRoleTextHost: { color: colors.primary, fontWeight: '600' },

  sectionTitleEyebrow: { paddingHorizontal: spacing.md, marginBottom: spacing.sm, letterSpacing: 1.5 },
});
