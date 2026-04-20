import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { PostCard } from '@/components/PostCard';
import { FeedSkeleton } from '@/components/FeedSkeleton';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { ScreenHeader } from '@/components/ScreenHeader';
import { CellarActivityStrip } from '@/components/CellarActivityStrip';
import Svg, { Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

export default function FeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { unreadCount, loadUnreadCount } = useNotifications();
  const lastLoadRef = React.useRef(0);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastLoadRef.current > 30000) { // 30초 캐시
        loadPosts();
        lastLoadRef.current = now;
      }
      loadUnreadCount();
    }, [])
  );

  async function loadPosts() {
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!postsData || postsData.length === 0) { setPosts([]); return; }

    const postIds = postsData.map(p => p.id);
    const userIds = [...new Set(postsData.map(p => p.user_id))];

    // Batch queries
    const [imgRes, profileRes, wineTagRes] = await Promise.all([
      supabase.from('post_images').select('post_id, image_url').in('post_id', postIds),
      supabase.from('profiles').select('id, username, display_name, avatar_url, collection_count').in('id', userIds),
      supabase.from('post_wines').select('post_id, wine_id').in('post_id', postIds),
    ]);

    // Batch fetch wines
    const wineIds = [...new Set((wineTagRes.data || []).map(w => w.wine_id))];
    let wineMap = new Map();
    if (wineIds.length > 0) {
      const { data: wines } = await supabase.from('wines').select('id, name, category').in('id', wineIds);
      wineMap = new Map(wines?.map(w => [w.id, w]) || []);
    }

    const imgMap = new Map();
    (imgRes.data || []).forEach(img => { if (!imgMap.has(img.post_id)) imgMap.set(img.post_id, img.image_url); });
    const profileMap = new Map((profileRes.data || []).map(p => [p.id, p]));
    const wineTagMap = new Map((wineTagRes.data || []).map(wt => [wt.post_id, wt.wine_id]));

    const enriched = postsData.map(post => ({
      ...post,
      image_url: imgMap.get(post.id) || null,
      profile: profileMap.get(post.user_id) || null,
      wine: wineTagMap.has(post.id) ? wineMap.get(wineTagMap.get(post.id)) || null : null,
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
      <ScreenHeader
        title={<Text style={styles.logo}>Cave</Text>}
        left={
          <Pressable onPress={() => router.push('/(tabs)/create')} hitSlop={8}>
            <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
              <Line x1={12} y1={5} x2={12} y2={19} />
              <Line x1={5} y1={12} x2={19} y2={12} />
            </Svg>
          </Pressable>
        }
        right={
          <Pressable onPress={() => router.push('/notifications')} hitSlop={8}>
            <Ionicons name="notifications-outline" size={24} color="#262626" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        }
      />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />}
      >
        <CellarActivityStrip />
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
