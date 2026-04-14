import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { usePopularPosts } from '@/lib/hooks/usePopularPosts';

export function PopularPosts() {
  const { posts, loadPopular } = usePopularPosts();
  const router = useRouter();

  useEffect(() => { loadPopular(); }, []);

  if (posts.length === 0) return null;

  return (
    <View>
      <Text style={styles.sectionTitle}>Popular Posts</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
        {posts.map(post => (
          <Pressable key={post.id} style={styles.card} onPress={() => router.push(`/user/${post.user_id}`)}>
            {post.image_url ? (
              <Image source={{ uri: post.image_url }} style={styles.image} />
            ) : (
              <View style={[styles.image, { backgroundColor: '#f0f0f0' }]} />
            )}
            <View style={styles.overlay}>
              <View style={styles.userRow}>
                {post.avatar_url ? (
                  <Image source={{ uri: post.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{post.username[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <Text style={styles.username} numberOfLines={1}>{post.username}</Text>
              </View>
              <Text style={styles.likes}>{post.like_count} likes</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#222', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  card: {
    width: 110, height: 150, borderRadius: 10,
    overflow: 'hidden', position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 8, paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
  likes: { fontSize: 9, color: 'rgba(255,255,255,0.8)' },
});
