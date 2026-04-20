import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { FollowButton } from '@/components/FollowButton';
import { getTopBadge } from '@/lib/tierUtils';
import { UserAvatar } from '@/components/UserAvatar';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { TasteCard } from '@/components/TasteCard';
import { useTasteProfile } from '@/lib/hooks/useTasteProfile';
import { useUserGatherings } from '@/lib/hooks/useUserGatherings';
import { useUserPicks } from '@/lib/hooks/useUserPicks';
import { useUserBadges } from '@/lib/hooks/useUserBadges';
import { MyPicksSection } from '@/components/MyPicksSection';
import { BadgeList } from '@/components/BadgeList';
import { UserCellarSection } from '@/components/UserCellarSection';
import { getDMRoom } from '@/lib/hooks/useChat';
import { formatMonthDay } from '@/lib/utils/dateUtils';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const { taste, loadTaste } = useTasteProfile(id);
  const { gatherings: userGatherings, loadGatherings: loadUserGatherings } = useUserGatherings(id);
  const { picks: userPicks, loadPicks: loadUserPicks } = useUserPicks(id);
  const { badges: userBadges, allBadges, loadBadges } = useUserBadges(id);

  useEffect(() => {
    if (id) {
      loadProfile();
      loadCollections();
      loadTaste();
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
      .select('*, wine:wines(name, category, region)')
      .eq('user_id', id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setCollections(data);
  }

  if (!profile) return <View style={styles.container} />;

  const fallbackChar = profile.display_name?.[0] || profile.username?.[0] || '?';

  const topBadge = getTopBadge(profile.collection_count || 0);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.headerTitle}>{profile.username}</Text>
            {topBadge && (
              <View style={[styles.headerBadge, { backgroundColor: topBadge.bg }]}>
                <Text style={[styles.headerBadgeText, { color: topBadge.color }]}>{topBadge.name}</Text>
              </View>
            )}
          </View>
        }
        left={<BackButton fallbackPath="/(tabs)/explore" />}
      />

      <ScrollView>
        <View style={styles.profileTop}>
          <UserAvatar
            uri={profile.avatar_url}
            fallbackChar={fallbackChar}
            collectionCount={profile.collection_count || 0}
            size="xl"
          />
          <View style={styles.profileStats}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile.post_count || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile.follower_count || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile.following_count || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile.display_name || profile.username}</Text>
          {profile.bio && <Text style={styles.profileBio}>{profile.bio}</Text>}
        </View>

        <View style={styles.actions}>
          <FollowButton targetUserId={id!} />
          {user?.id !== id && (
            <Pressable style={styles.dmBtn} onPress={async () => {
              if (!user) return;
              const roomId = await getDMRoom(user.id, id!);
              if (roomId) router.push(`/chat/${roomId}?title=${encodeURIComponent(profile.username)}`);
            }}>
              <Text style={styles.dmBtnText}>Message</Text>
            </Pressable>
          )}
        </View>

        {userBadges.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginBottom: 8 }]}>Badges</Text>
            <BadgeList allBadges={allBadges} earnedIds={new Set(userBadges.map(b => b.badge_id))} />
          </View>
        )}

        {userPicks.length > 0 && <MyPicksSection picks={userPicks} />}

        {taste && <TasteCard taste={taste} />}

        {userGatherings.length > 0 && (
          <View style={styles.gatheringSection}>
            <Text style={styles.sectionTitle}>Gatherings ({userGatherings.length})</Text>
            {userGatherings.map(g => {
              const dateStr = formatMonthDay(g.gathering_date);
              return (
                <Pressable key={g.id} style={styles.gatheringItem} onPress={() => router.push(`/gathering/${g.id}`)}>
                  <View style={styles.gatheringInfo}>
                    <Text style={styles.gatheringTitle}>{g.title}</Text>
                    <Text style={styles.gatheringMeta}>{dateStr}{g.location ? ` · ${g.location}` : ''}</Text>
                  </View>
                  <View style={[styles.gatheringRole, g.role === 'host' && styles.gatheringRoleHost]}>
                    <Text style={[styles.gatheringRoleText, g.role === 'host' && styles.gatheringRoleTextHost]}>
                      {g.role === 'host' ? 'Host' : 'Joined'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <UserCellarSection ownerId={id!} wines={collections} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#222' },
  headerBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  headerBadgeText: { fontSize: 10, fontWeight: '600' },

  profileTop: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 20 },
  profileStats: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 20 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 17, fontWeight: '700', color: '#222' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 2 },

  profileInfo: { paddingHorizontal: 20, paddingBottom: 16 },
  profileName: { fontSize: 14, fontWeight: '600', color: '#222' },
  profileBio: { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 18 },

  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 16 },
  dmBtn: {
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingVertical: 8, alignItems: 'center',
  },
  dmBtnText: { fontSize: 13, fontWeight: '600', color: '#222' },

  gatheringSection: { paddingHorizontal: 20, paddingTop: 8 },
  gatheringItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  gatheringInfo: { flex: 1 },
  gatheringTitle: { fontSize: 14, fontWeight: '600', color: '#222' },
  gatheringMeta: { fontSize: 11, color: '#999', marginTop: 3 },
  gatheringRole: { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  gatheringRoleHost: { backgroundColor: '#f7f0f3' },
  gatheringRoleText: { fontSize: 11, fontWeight: '600', color: '#2e7d32' },
  gatheringRoleTextHost: { color: '#7b2d4e' },

  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 12 },
});
