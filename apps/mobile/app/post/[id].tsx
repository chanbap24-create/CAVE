import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { PostCard } from '@/components/PostCard';
import Svg, { Polyline } from 'react-native-svg';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    if (id) loadPost();
  }, [id]);

  async function loadPost() {
    const { data: fullPost } = await supabase.from('posts').select('*').eq('id', id).single();
    if (!fullPost) return;

    const [imgRes, profileRes, wineRes] = await Promise.all([
      supabase.from('post_images').select('image_url').eq('post_id', fullPost.id).limit(1),
      supabase.from('profiles').select('username, display_name, avatar_url').eq('id', fullPost.user_id).single(),
      supabase.from('post_wines').select('wine_id').eq('post_id', fullPost.id).limit(1),
    ]);

    let wine = null;
    if (wineRes.data?.[0]) {
      const { data: w } = await supabase.from('wines').select('id, name, category').eq('id', wineRes.data[0].wine_id).single();
      wine = w;
    }

    setPost({
      ...fullPost,
      image_url: imgRes.data?.[0]?.image_url || null,
      profile: profileRes.data,
      wine,
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
            <Polyline points="15 18 9 12 15 6" />
          </Svg>
        </Pressable>
        <Text style={styles.title}>Post</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView>
        {post && <PostCard post={post} />}
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
  title: { fontSize: 17, fontWeight: '700', color: '#222' },
});
