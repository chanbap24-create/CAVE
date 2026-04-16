import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { FollowButton } from '@/components/FollowButton';
import { TasteCard } from '@/components/TasteCard';
import { useTasteProfile } from '@/lib/hooks/useTasteProfile';
import { useUserGatherings } from '@/lib/hooks/useUserGatherings';
import { useUserPicks } from '@/lib/hooks/useUserPicks';
import { MyPicksSection } from '@/components/MyPicksSection';
import { getDMRoom } from '@/lib/hooks/useChat';
import Svg, { Path, Polyline } from 'react-native-svg';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const { taste, loadTaste } = useTasteProfile(id);
  const { gatherings: userGatherings, loadGatherings: loadUserGatherings } = useUserGatherings(id);
  const { picks: userPicks, loadPicks: loadUserPicks } = useUserPicks(id);

  useEffect(() => {
    if (id) {
      loadProfile();
      loadCollections();
      loadTaste();
      loadUserGatherings();
      loadUserPicks();
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

  const initial = profile.display_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase() || '?';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
            <Polyline points="15 18 9 12 15 6" />
          </Svg>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.headerTitle}>{profile.username}</Text>
          {(() => {
            const cc = profile.collection_count || 0;
            let b = null;
            if (cc >= 100) b = { name: 'Master', bg: '#f0ecf8', color: '#7860a8' };
            else if (cc >= 50) b = { name: 'Expert', bg: '#faf0d0', color: '#a07818' };
            else if (cc >= 10) b = { name: 'Collector', bg: '#f7f0f3', color: '#7b2d4e' };
            return b ? (
              <View style={[styles.headerBadge, { backgroundColor: b.bg }]}>
                <Text style={[styles.headerBadgeText, { color: b.color }]}>{b.name}</Text>
              </View>
            ) : null;
          })()}
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        <View style={styles.profileTop}>
          {profile.avatar_url ? (
            <View style={profile.collection_count >= 50 ? styles.avatarGlow : undefined}>
              <Image source={{ uri: profile.avatar_url }} style={[styles.avatarLgImg, profile.collection_count >= 50 && styles.avatarGoldBorder]} />
            </View>
          ) : (
            <View style={[styles.avatarLg, profile.collection_count >= 50 && styles.avatarGoldBorder]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
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

        {userPicks.length > 0 && <MyPicksSection picks={userPicks} />}

        {taste && <TasteCard taste={taste} />}

        {userGatherings.length > 0 && (
          <View style={styles.gatheringSection}>
            <Text style={styles.sectionTitle}>Gatherings ({userGatherings.length})</Text>
            {userGatherings.map(g => {
              const d = g.gathering_date ? new Date(g.gathering_date) : null;
              const dateStr = d ? `${d.getMonth()+1}.${d.getDate()}` : '';
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

        {collections.length > 0 && (
          <View style={styles.caveSection}>
            <Text style={styles.sectionTitle}>Cave ({collections.length})</Text>
            {collections.map(c => (
              <View key={c.id} style={styles.caveItem}>
                <Text style={styles.caveName}>{c.wine?.name}</Text>
                <Text style={styles.caveMeta}>{c.wine?.region} · {c.wine?.category}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#222' },
  headerBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  headerBadgeText: { fontSize: 10, fontWeight: '600' },

  profileTop: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 20 },
  avatarLg: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '600', color: '#999' },
  avatarLgImg: { width: 80, height: 80, borderRadius: 40 },
  avatarGlow: {
    borderRadius: 44, padding: 2,
    shadowColor: '#c9a84c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarGoldBorder: { borderWidth: 2, borderColor: '#c9a84c' },
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

  caveSection: { paddingHorizontal: 20, paddingTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 12 },
  caveItem: {
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  caveName: { fontSize: 14, fontWeight: '500', color: '#222' },
  caveMeta: { fontSize: 11, color: '#999', marginTop: 2 },
});
