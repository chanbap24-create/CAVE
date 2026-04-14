import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { PostCard } from '@/components/PostCard';
import { FeedSkeleton } from '@/components/FeedSkeleton';
import { useNotifications } from '@/lib/hooks/useNotifications';
import Svg, { Path, Line } from 'react-native-svg';

export default function FeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { unreadCount, loadUnreadCount } = useNotifications();

  useFocusEffect(
    useCallback(() => { loadPosts(); loadUnreadCount(); }, [])
  );

  async function loadPosts() {
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!postsData) return;

    const enriched = await Promise.all(postsData.map(async (post) => {
      const [imgRes, profileRes, wineRes] = await Promise.all([
        supabase.from('post_images').select('image_url').eq('post_id', post.id).order('display_order').limit(1),
        supabase.from('profiles').select('username, display_name, avatar_url').eq('id', post.user_id).single(),
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerLeft} onPress={() => router.push('/(tabs)/create')}>
          <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
            <Line x1={12} y1={5} x2={12} y2={19} />
            <Line x1={5} y1={12} x2={19} y2={12} />
          </Svg>
        </Pressable>
        <Text style={styles.logo}>Cave</Text>
        <Pressable style={styles.headerRight} onPress={() => router.push('/notifications')}>
          <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
            <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </Svg>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />}
      >
        {posts === null ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <FeedSkeleton />
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
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
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  headerLeft: {
    position: 'absolute', left: 20, top: 62,
  },
  headerRight: {
    position: 'absolute', right: 20, top: 62,
  },
  badge: {
    position: 'absolute', top: -4, right: -6,
    backgroundColor: '#ed4956', borderRadius: 9,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  logo: { fontFamily: 'PlayfairDisplay_700Bold_Italic', fontSize: 24, color: '#7b2d4e' },
  empty: { alignItems: 'center', paddingTop: 120 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#222', marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 22 },
});
