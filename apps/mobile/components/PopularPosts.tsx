import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { usePopularPosts } from '@/lib/hooks/usePopularPosts';
import { VideoPlayer } from './VideoPlayer';

interface Props {
  refreshKey?: number;
  category?: string | null;
}

export function PopularPosts({ refreshKey = 0, category }: Props) {
  const { posts, loadPopular } = usePopularPosts(category);
  const router = useRouter();

  useEffect(() => { loadPopular(); }, [refreshKey, loadPopular]);

  if (posts.length === 0) return null;

  return (
    <View>
      <Text style={styles.sectionTitle}>Popular Posts</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
        {posts.map(post => (
          <Pressable key={post.id} style={styles.card} onPress={() => router.push(`/post/${post.id}`)}>
            {post.video_playback_id ? (
              <View style={styles.image}>
                <VideoPlayer playbackId={post.video_playback_id} />
              </View>
            ) : post.image_url ? (
              <Image source={post.image_url} style={styles.image} contentFit="cover" cachePolicy="memory-disk" transition={200} />
            ) : (
              <View style={[styles.image, { backgroundColor: '#f0f0f0' }]} />
            )}
            <View style={styles.overlay}>
              <View style={styles.userRow}>
                {post.avatar_url ? (
                  <Image source={post.avatar_url} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" transition={150} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{post.username[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <Text style={styles.username} numberOfLines={1}>{post.username}</Text>
              </View>
              <View style={styles.bottomRow}>
                <Text style={styles.likes}>{post.like_count} likes</Text>
                {post.video_playback_id && <Text style={styles.videoIcon}>▶</Text>}
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#222', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  card: { width: 110, height: 150, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  image: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 8, paddingTop: 20, backgroundColor: 'rgba(0,0,0,0.3)',
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  avatar: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#fff' },
  avatarPlaceholder: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 7, fontWeight: '600', color: '#fff' },
  username: { fontSize: 9, fontWeight: '600', color: '#fff', flex: 1 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  likes: { fontSize: 9, color: 'rgba(255,255,255,0.8)' },
  videoIcon: { fontSize: 12, color: '#fff' },
});
