import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { FollowButton } from '@/components/FollowButton';
import Svg, { Path, Polyline } from 'react-native-svg';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadProfile();
      loadCollections();
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
        <Text style={styles.headerTitle}>{profile.username}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        <View style={styles.profileTop}>
          <View style={styles.avatarLg}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
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
        </View>

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

  profileTop: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 20 },
  avatarLg: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '600', color: '#999' },
  profileStats: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 20 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 17, fontWeight: '700', color: '#222' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 2 },

  profileInfo: { paddingHorizontal: 20, paddingBottom: 16 },
  profileName: { fontSize: 14, fontWeight: '600', color: '#222' },
  profileBio: { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 18 },

  actions: { paddingHorizontal: 20, paddingBottom: 16 },

  caveSection: { paddingHorizontal: 20, paddingTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 12 },
  caveItem: {
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  caveName: { fontSize: 14, fontWeight: '500', color: '#222' },
  caveMeta: { fontSize: 11, color: '#999', marginTop: 2 },
});
