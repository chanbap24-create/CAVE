import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Pressable, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';

const tagColors: Record<string, { bg: string; color: string }> = {
  wine: { bg: '#f7f0f3', color: '#7b2d4e' },
  whiskey: { bg: '#f5f0e8', color: '#8a6d3b' },
  sake: { bg: '#eef2f7', color: '#3b6d8a' },
  cognac: { bg: '#f5efe8', color: '#8a5a3b' },
  other: { bg: '#f0f0f0', color: '#666' },
};

export default function FeedScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => { loadPosts(); }, [])
  );

  async function loadPosts() {
    // Step 1: Get posts
    const { data: postsData, error } = await supabase
      .from('posts')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !postsData) return;

    // Step 2: Enrich with images, profile, wines
    const enriched = await Promise.all(postsData.map(async (post) => {
      const [imgRes, profileRes, wineRes] = await Promise.all([
        supabase.from('post_images').select('image_url').eq('post_id', post.id).order('display_order').limit(1),
        supabase.from('profiles').select('username, display_name').eq('id', post.user_id).single(),
        supabase.from('post_wines').select('wine_id').eq('post_id', post.id).limit(1),
      ]);

      let wine = null;
      if (wineRes.data?.[0]) {
        const { data: w } = await supabase.from('wines').select('id, name, category').eq('id', wineRes.data[0].wine_id).single();
        wine = w;
      }

      return {
        ...post,
        image_url: imgRes.data?.[0]?.image_url || null,
        profile: profileRes.data,
        wine,
      };
    }));

    setPosts(enriched);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Cave</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />}
      >
        {posts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyDesc}>Be the first to share{'\n'}your collection</Text>
          </View>
        ) : (
          posts.map(post => {
            const profile = post.profile;
            const initial = profile?.display_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || '?';
            const wine = post.wine;
            const tc = wine ? (tagColors[wine.category] || tagColors.other) : null;

            return (
              <View key={post.id} style={styles.post}>
                <View style={styles.postHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{profile?.username || 'unknown'}</Text>
                  </View>
                  <Text style={styles.more}>...</Text>
                </View>

                {post.image_url ? (
                  <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.postImage, { backgroundColor: '#f5f5f5' }]} />
                )}

                <View style={styles.postBody}>
                  {post.like_count > 0 && (
                    <Text style={styles.likes}>{post.like_count} likes</Text>
                  )}
                  {post.caption ? (
                    <Text style={styles.caption}>
                      <Text style={styles.bold}>{profile?.username} </Text>
                      {post.caption}
                    </Text>
                  ) : null}
                  {wine && tc && (
                    <View style={[styles.drinkTag, { backgroundColor: tc.bg }]}>
                      <Text style={[styles.drinkTagText, { color: tc.color }]}>{wine.name}</Text>
                    </View>
                  )}
                  <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
    alignItems: 'center',
  },
  logo: { fontFamily: 'PlayfairDisplay_700Bold_Italic', fontSize: 24, color: '#7b2d4e' },

  empty: { alignItems: 'center', paddingTop: 120 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#222', marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 22 },

  post: { borderBottomWidth: 1, borderBottomColor: '#efefef' },
  postHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, paddingHorizontal: 16, gap: 10,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '600', color: '#666' },
  userName: { fontSize: 14, fontWeight: '600', color: '#222' },
  more: { fontSize: 18, color: '#999', letterSpacing: 2 },

  postImage: { width: '100%', height: 390 },

  postBody: { padding: 12, paddingHorizontal: 16 },
  likes: { fontSize: 13, fontWeight: '600', color: '#222', marginBottom: 4 },
  caption: { fontSize: 13, color: '#222', lineHeight: 18 },
  bold: { fontWeight: '600' },
  drinkTag: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, marginTop: 6,
  },
  drinkTagText: { fontSize: 12, fontWeight: '500' },
  time: { fontSize: 11, color: '#bbb', marginTop: 6 },
});
