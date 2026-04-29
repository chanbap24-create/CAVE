import React from 'react';
import { View, StyleSheet, Pressable, Text, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { MyPost } from '@/lib/hooks/useMyPosts';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 4) / 3;

interface Props {
  posts: MyPost[];
  onLongPress?: (post: MyPost) => void;
}

export function PostGrid({ posts, onLongPress }: Props) {
  const router = useRouter();

  if (posts.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No posts yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {posts.map(post => (
        <Pressable
          key={post.id}
          style={styles.item}
          onPress={() => router.push(`/post/${post.id}`)}
          onLongPress={() => onLongPress?.(post)}
        >
          {post.image_url ? (
            <Image source={post.image_url} style={styles.image} contentFit="cover" cachePolicy="memory-disk" transition={150} />
          ) : (
            <View style={[styles.image, { backgroundColor: '#f0f0f0' }]} />
          )}
          {post.video_playback_id && (
            <View style={styles.videoIcon}>
              <Text style={styles.videoIconText}>▶</Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 2,
    borderTopWidth: 1, borderTopColor: '#efefef',
  },
  item: { width: ITEM_SIZE, height: ITEM_SIZE, position: 'relative' },
  image: { width: '100%', height: '100%' },
  videoIcon: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10,
    width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
  },
  videoIconText: { fontSize: 9, color: '#fff' },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#bbb' },
});
